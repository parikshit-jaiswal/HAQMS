const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports/doctor-stats
// Highly inefficient nested loop aggregate reporting for admin/receptionists dashboard
// PERFORMANCE BUG: Performs multiple nested DB queries inside a loop for every doctor.
// Runs sequentially, blocking/scaling terrible with doctors count.
router.get('/doctor-stats', authenticate, async (req, res) => {
  try {
    const start = Date.now();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [doctors, appointmentCounts, queueCounts] = await Promise.all([
      prisma.doctor.findMany({
        select: {
          id: true,
          name: true,
          specialization: true,
          department: true,
          consultationFee: true,
        },
      }),
      prisma.appointment.groupBy({
        by: ['doctorId', 'status'],
        _count: { _all: true },
      }),
      prisma.queueToken.groupBy({
        by: ['doctorId'],
        where: { createdAt: { gte: today } },
        _count: { _all: true },
      }),
    ]);

    const appointmentCountMap = new Map();
    for (const row of appointmentCounts) {
      const key = `${row.doctorId}:${row.status}`;
      appointmentCountMap.set(key, row._count._all);
    }

    const queueCountMap = new Map();
    for (const row of queueCounts) {
      queueCountMap.set(row.doctorId, row._count._all);
    }

    const reportData = doctors.map((doc) => {
      const totalAppointments =
        (appointmentCountMap.get(`${doc.id}:PENDING`) || 0) +
        (appointmentCountMap.get(`${doc.id}:COMPLETED`) || 0) +
        (appointmentCountMap.get(`${doc.id}:CANCELLED`) || 0);
      const completedAppointments = appointmentCountMap.get(`${doc.id}:COMPLETED`) || 0;
      const cancelledAppointments = appointmentCountMap.get(`${doc.id}:CANCELLED`) || 0;
      const todayQueueSize = queueCountMap.get(doc.id) || 0;
      const revenue = completedAppointments * doc.consultationFee;

      return {
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization,
        department: doc.department,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        todayQueueSize,
        revenue,
      };
    });

    const durationMs = Date.now() - start;

    res.json({
      success: true,
      timeTakenMs: durationMs,
      data: reportData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

module.exports = router;
