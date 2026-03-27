const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
});

const User = sequelize.define('User', {
    id: {
        type: DataTypes.STRING, 
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.STRING, // 'doctor', 'patient', 'admin'
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING
    },
    lastName: {
        type: DataTypes.STRING
    },
    specialization: {
        type: DataTypes.STRING
    },
    gender: {
        type: DataTypes.STRING
    },
    dateOfBirth: {
        type: DataTypes.STRING
    },
    age: {
        type: DataTypes.INTEGER
    },
    refreshToken: {
        type: DataTypes.STRING
    },
    lastSessionId: {
        type: DataTypes.STRING
    },
    isBanned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

const Comment = sequelize.define('Comment', {
    id: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    doctorId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    authorId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    authorName: {
        type: DataTypes.STRING
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 }
    },
    date: {
        type: DataTypes.STRING 
    },
    reply: {
        type: DataTypes.TEXT 
    }
});

const Availability = sequelize.define('Availability', {
    id: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    doctorId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isCyclic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    date: {
        type: DataTypes.STRING
    },
    startDate: {
        type: DataTypes.STRING 
    },
    endDate: {
        type: DataTypes.STRING 
    },
    daysOfWeek: {
        type: DataTypes.JSON, 
        defaultValue: []
    },
    startTime: {
        type: DataTypes.STRING, 
        allowNull: false
    },
    endTime: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

const Absence = sequelize.define('Absence', {
    id: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    doctorId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    date: {
        type: DataTypes.STRING,
        allowNull: false
    },
    reason: {
        type: DataTypes.STRING
    }
});

const Reservation = sequelize.define('Reservation', {
    id: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    doctorId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    patientId: {
        type: DataTypes.STRING,
        allowNull: true 
    },
    patientDetails: {
        type: DataTypes.JSON, 
        allowNull: true
    },
    startDateTime: {
        type: DataTypes.STRING,
        allowNull: false
    },
    endDateTime: {
        type: DataTypes.STRING, 
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    notes: {
        type: DataTypes.TEXT
    },
    status: {
        type: DataTypes.STRING, // 'confirmed', 'cancelled', 'pending'
        defaultValue: 'pending'
    },
    documents: {
        type: DataTypes.JSON, 
        defaultValue: []
    }
});

// Relations
User.hasMany(Availability, { foreignKey: 'doctorId' });
User.hasMany(Absence, { foreignKey: 'doctorId' });
User.hasMany(Reservation, { foreignKey: 'doctorId' });
User.hasMany(Comment, { foreignKey: 'doctorId' });
Comment.belongsTo(User, { foreignKey: 'doctorId', targetKey: 'id', as: 'doctor' }); 


const initDb = async () => {
    try {
        await sequelize.sync({ force: true }); 
        console.log('Database synced');

        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync('12345', salt);
        const adminHash = bcrypt.hashSync('12345', salt);

        await User.create({
            id: 'mock-admin-1',
            email: 'admin@med.pl',
            password: adminHash,
            role: 'admin',
            firstName: 'Admin',
            lastName: 'System'
        });

        const doc1 = await User.create({
            id: 'mock-doc-1',
            email: 'doc@med.pl',
            password: hash,
            role: 'doctor',
            firstName: 'Anna',
            lastName: 'Nowak',
            specialization: 'Kardiolog',
            gender: 'female'
        });

        const doc2 = await User.create({
            id: 'mock-doc-2',
            email: 'chirurg@med.pl',
            password: hash,
            role: 'doctor',
            firstName: 'Janusz',
            lastName: 'Chirurg',
            specialization: 'Chirurg',
            gender: 'male'
        });

        const doc3 = await User.create({
            id: 'mock-doc-3',
            email: 'pediatra@med.pl',
            password: hash,
            role: 'doctor',
            firstName: 'Maria',
            lastName: 'Dziecięca',
            specialization: 'Pediatra',
            gender: 'female'
        });

        const doc4 = await User.create({
            id: 'mock-doc-4',
            email: 'dermatolog@med.pl',
            password: hash,
            role: 'doctor',
            firstName: 'Piotr',
            lastName: 'Skórny',
            specialization: 'Dermatolog',
            gender: 'male'
        });

        const pat1 = await User.create({
            id: 'mock-patient-1',
            email: 'jan@kowalski.pl',
            password: hash,
            role: 'patient',
            firstName: 'Jan',
            lastName: 'Kowalski',
            gender: 'male',
            dateOfBirth: '1984-05-15',
            age: 41
        });

        const pat2 = await User.create({
            id: 'mock-patient-2',
            email: 'ania@kwiatkowska.pl',
            password: hash,
            role: 'patient',
            firstName: 'Anna',
            lastName: 'Kwiatkowska',
            gender: 'female',
            dateOfBirth: '1990-03-20',
            age: 35
        });

        const pat3 = await User.create({
            id: 'mock-patient-3',
            email: 'tomasz@igielski.pl',
            password: hash,
            role: 'patient',
            firstName: 'Tomasz',
            lastName: 'Igielski',
            gender: 'male',
            dateOfBirth: '1975-11-11',
            age: 50
        });


        await Availability.create({
            doctorId: doc1.id,
            isCyclic: true,
            startDate: '2026-01-01',
            endDate: '2026-02-28',
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: '08:00',
            endTime: '16:00'
        });

        await Availability.create({
            doctorId: doc2.id,
            isCyclic: true,
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            daysOfWeek: [1, 3, 5],
            startTime: '10:00',
            endTime: '18:00'
        });

        await Availability.create({
            doctorId: doc3.id,
            isCyclic: true,
            startDate: '2026-01-01',
            endDate: '2026-12-31',
            daysOfWeek: [2, 4],
            startTime: '09:00',
            endTime: '15:00'
        });

        await Availability.create({
            doctorId: doc4.id,
            isCyclic: false,
            date: '2026-02-10', 
            startTime: '12:00',
            endTime: '20:00',
            daysOfWeek: [] 
        });
        await Availability.create({
            doctorId: doc4.id,
            isCyclic: false,
            date: '2026-02-11',
            startTime: '12:00',
            endTime: '20:00',
            daysOfWeek: [] 
        });

        await Absence.create({
            doctorId: doc1.id,
            date: '2026-02-05',
            reason: 'Urlop wypoczynkowy'
        });
        
        await Absence.create({
            doctorId: doc3.id,
            date: '2026-02-03',
            reason: 'L4 - Zwolnienie lekarskie'
        });

        await Reservation.create({
            id: 'res-past-1',
            doctorId: doc1.id,
            patientId: pat1.id,
            patientDetails: { firstName: pat1.firstName, lastName: pat1.lastName, age: pat1.age, gender: pat1.gender },
            startDateTime: '2026-01-10T09:00:00.000Z',
            endDateTime: '2026-01-10T09:30:00.000Z',
            type: 'pierwsza_wizyta',
            status: 'confirmed',
            notes: 'Bóle w klatce piersiowej'
        });

        await Reservation.create({
            id: 'res-past-2',
            doctorId: doc2.id,
            patientId: pat2.id,
            patientDetails: { firstName: pat2.firstName, lastName: pat2.lastName, age: pat2.age, gender: pat2.gender },
            startDateTime: '2026-01-15T11:00:00.000Z',
            endDateTime: '2026-01-15T11:30:00.000Z',
            type: 'konsultacja',
            status: 'confirmed',
            notes: 'Usunięcie znamienia'
        });

        await Reservation.create({
            id: 'res-future-1',
            doctorId: doc2.id,
            patientId: pat1.id,
            patientDetails: { firstName: pat1.firstName, lastName: pat1.lastName, age: pat1.age, gender: pat1.gender },
            startDateTime: '2026-02-02T10:00:00.000Z', 
            endDateTime: '2026-02-02T10:30:00.000Z',
            type: 'kontrolna',
            status: 'confirmed',
            notes: 'Kontrola po zabiegu'
        });

        await Reservation.create({
            id: 'res-future-2',
            doctorId: doc3.id,
            patientId: pat3.id,
            patientDetails: { firstName: pat3.firstName, lastName: pat3.lastName, age: pat3.age, gender: pat3.gender },
            startDateTime: '2026-01-27T09:30:00.000Z', 
            endDateTime: '2026-01-27T10:00:00.000Z',
            type: 'pierwsza_wizyta',
            status: 'confirmed',
            notes: 'Wypryski na skórze'
        });

        await Comment.create({
            doctorId: doc2.id,
            authorId: pat2.id,
            authorName: `${pat2.firstName} ${pat2.lastName}`,
            content: "Lekarz konkretny, ale wizyta opóźniona o 15 minut.",
            rating: 3,
            date: '2026-01-16T09:00:00.000Z'
        });
        
        console.log('Seed data created');

    } catch (error) {
        console.error('Database initialization failed:', error);
    }
};

module.exports = {
    sequelize,
    User,
    Availability,
    Absence,
    Reservation,
    Comment,
    initDb
};
