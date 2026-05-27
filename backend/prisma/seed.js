const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const [admin, receptionist, doctorUser] = await prisma.$transaction([
    prisma.user.upsert({
      where: { email: 'admin@haqms.com' },
      update: {},
      create: {
        email: 'admin@haqms.com',
        password: passwordHash,
        name: 'System Admin',
        role: 'ADMIN',
      },
    }),
    prisma.user.upsert({
      where: { email: 'reception1@haqms.com' },
      update: {},
      create: {
        email: 'reception1@haqms.com',
        password: passwordHash,
        name: 'Reception One',
        role: 'RECEPTIONIST',
      },
    }),
    prisma.user.upsert({
      where: { email: 'doctor1@haqms.com' },
      update: {},
      create: {
        email: 'doctor1@haqms.com',
        password: passwordHash,
        name: 'Doctor One',
        role: 'DOCTOR',
      },
    }),
  ]);

  const [drA, drB] = await prisma.$transaction([
    prisma.doctor.upsert({
      where: { userId: doctorUser.id },
      update: {
        name: 'Dr. Meredith Grey',
        specialization: 'General Surgery',
        department: 'Surgery',
        consultationFee: 500,
        experience: 12,
        startTime: '09:00',
        endTime: '17:00',
      },
      create: {
        userId: doctorUser.id,
        name: 'Dr. Meredith Grey',
        specialization: 'General Surgery',
        department: 'Surgery',
        consultationFee: 500,
        experience: 12,
        startTime: '09:00',
        endTime: '17:00',
      },
    }),
    prisma.doctor.create({
      data: {
        name: 'Dr. Gregory House',
        specialization: 'Diagnostics',
        department: 'Medicine',
        consultationFee: 650,
        experience: 18,
        startTime: '10:00',
        endTime: '18:00',
      },
    }),
  ]);

  const [patientA, patientB] = await prisma.$transaction([
    prisma.patient.create({
      data: {
        name: 'Clark Kent',
        email: 'clark.kent@example.com',
        phoneNumber: '5551002001',
        age: 35,
        gender: 'MALE',
        medicalHistory: null,
      },
    }),
    prisma.patient.create({
      data: {
        name: 'Bruce Wayne',
        email: 'bruce.wayne@example.com',
        phoneNumber: '5551002002',
        age: 40,
        gender: 'MALE',
        medicalHistory: 'Chronic insomnia and stress-related migraines.',
      },
    }),
  ]);

  const [appointmentA, appointmentB] = await prisma.$transaction([
    prisma.appointment.create({
      data: {
        patientId: patientA.id,
        doctorId: drA.id,
        appointmentDate: new Date(Date.now() + 60 * 60 * 1000),
        reason: 'Routine checkup',
        status: 'PENDING',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patientB.id,
        doctorId: drB.id,
        appointmentDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        reason: 'Recurring headaches',
        status: 'PENDING',
      },
    }),
  ]);

  await prisma.queueToken.create({
    data: {
      tokenNumber: 1,
      patientId: patientA.id,
      doctorId: drA.id,
      appointmentId: appointmentA.id,
      status: 'WAITING',
    },
  });

  console.log('Seed complete:', {
    users: [admin.email, receptionist.email, doctorUser.email],
    doctors: [drA.name, drB.name],
    patients: [patientA.name, patientB.name],
  });
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
