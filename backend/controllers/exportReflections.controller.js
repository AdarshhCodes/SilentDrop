'use strict';

/**
 * Export handler for GET /api/reflections/export
 *
 * Supports ?format=csv|pdf  &  ?range=30|90|all
 *
 * Security / privacy notes:
 *   - Requires JWT auth (enforced at route level).
 *   - Reflection note content is streamed directly to the response —
 *     it is NEVER written to server logs (same policy as reflection.controller.js).
 *   - Content-Disposition is set to "attachment" so browsers always
 *     download the file rather than rendering it inline.
 */

const Reflection = require('../models/Reflection');
const User       = require('../models/User');
const logger     = require('../utils/logger');

// Mood enum → human-readable label
const MOOD_LABELS = {
  flow:     'Flow state',
  okay:     'Okay',
  stressed: 'Stressed',
  none:     'Not recorded',
};

function moodLabel(raw) {
  return MOOD_LABELS[raw] ?? raw ?? 'Not recorded';
}

/** YYYY-MM-DD string from a Date object using local UTC date */
function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchReflections(userId, range) {
  const query = Reflection.find({ user: userId }).sort({ date: -1 });
  if (range === 'all') return query.lean();
  const limit = range === '90' ? 90 : 30;
  return query.limit(limit).lean();
}

// ─── CSV export ───────────────────────────────────────────────────────────────

async function exportCSV(req, res, next, reflections, username) {
  try {
    const { stringify } = require('csv-stringify');

    const filename = `reflections-${username}-${todayStamp()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const stringifier = stringify({
      header: true,
      columns: [
        { key: 'date',  header: 'Date'  },
        { key: 'mood',  header: 'Mood'  },
        { key: 'note',  header: 'Note'  },
      ],
      cast: {
        // Convert mood enum to human-readable label in the output
        string: (value, ctx) =>
          ctx.column === 'mood' ? moodLabel(value) : (value ?? ''),
      },
    });

    stringifier.on('error', (err) => {
      logger.error({ err }, 'CSV stringifier error');
      // Headers already sent — can't send a JSON error, just destroy
      res.destroy(err);
    });

    stringifier.pipe(res);
    for (const r of reflections) {
      stringifier.write({ date: r.date, mood: r.mood, note: r.note ?? '' });
    }
    stringifier.end();
  } catch (err) {
    next(err);
  }
}

// ─── PDF export ───────────────────────────────────────────────────────────────

async function exportPDF(req, res, next, reflections, username) {
  try {
    const PDFDocument = require('pdfkit');

    const filename = `reflections-${username}-${todayStamp()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 60, bottom: 60, left: 60, right: 60 },
      info: {
        Title:   'SilentDrop — Reflection History',
        Author:  `@${username}`,
        Creator: 'SilentDrop',
      },
    });

    doc.pipe(res);

    // ── Header ────────────────────────────────────────────────────────────────
    // Soft indigo accent line (§9: minimal aesthetic, no heavy borders)
    doc
      .rect(60, 48, doc.page.width - 120, 2)
      .fill('#6366f1');  // indigo-500

    doc
      .moveDown(0.5)
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor('#0f172a')            // slate-900
      .text('SilentDrop', { align: 'left' })
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#64748b')            // slate-500
      .text('Reflection History', { align: 'left' })
      .moveDown(0.3)
      .fontSize(9)
      .fillColor('#94a3b8')            // slate-400
      .text(`@${username}  ·  Exported ${todayStamp()}`, { align: 'left' })
      .moveDown(1.5);

    // ── Entries ───────────────────────────────────────────────────────────────
    if (reflections.length === 0) {
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#94a3b8')
        .text('No reflection records found for the requested range.', { align: 'center' });
    }

    reflections.forEach((r, idx) => {
      // Add a page break if needed (pdfkit handles overflow, but a manual
      // check prevents splitting an entry across pages badly)
      if (idx > 0 && doc.y > doc.page.height - 160) {
        doc.addPage();
      }

      // Date pill — light slate background (minimal aesthetic)
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#6366f1')           // indigo-500
        .text(r.date, { continued: false });

      // Mood — human-readable
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#64748b')
        .text(`Mood: ${moodLabel(r.mood)}`);

      // Note — if empty show a soft placeholder
      const noteText = r.note?.trim() || '(no note recorded)';
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#1e293b')           // slate-800
        .text(noteText, {
          width: doc.page.width - 120,
          lineGap: 2,
        });

      // Separator — a very thin slate-100 line (minimal, not heavy)
      doc.moveDown(0.6);
      if (idx < reflections.length - 1) {
        doc
          .moveTo(60, doc.y)
          .lineTo(doc.page.width - 60, doc.y)
          .lineWidth(0.5)
          .strokeColor('#e2e8f0')       // slate-200
          .stroke();
        doc.moveDown(0.6);
      }
    });

    // ── Footer ─────────────────────────────────────────────────────────────────
    doc
      .moveDown(2)
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#cbd5e1')             // slate-300
      .text('Generated by SilentDrop · silentdrop.app', { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
}

// ─── Main export controller ───────────────────────────────────────────────────

exports.exportReflections = async (req, res, next) => {
  try {
    const format = (req.query.format || 'csv').toLowerCase();
    const range  = (req.query.range  || '30').toLowerCase();

    // Validate params
    if (!['csv', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'format must be csv or pdf' });
    }
    if (!['30', '90', 'all'].includes(range)) {
      return res.status(400).json({ error: 'range must be 30, 90, or all' });
    }

    // Fetch username for the filename (from DB — jwt only carries githubUsername)
    const user = await User.findById(req.user.id).select('username').lean();
    const username = user?.username ?? req.user.githubUsername ?? 'user';

    const reflections = await fetchReflections(req.user.id, range);

    logger.info(
      { reqId: req.id, userId: req.user.id, format, range, count: reflections.length },
      'Reflection export requested'
      // Note: note content is not logged — privacy policy
    );

    if (format === 'pdf') {
      return exportPDF(req, res, next, reflections, username);
    }
    return exportCSV(req, res, next, reflections, username);

  } catch (err) {
    next(err);
  }
};
