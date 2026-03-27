const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { sequelize, User, Availability, Absence, Reservation, Comment, initDb } = require('./database');
const authController = require('./controllers/authController');
const dataController = require('./controllers/dataController'); 
const { authenticateToken, authorizeRoles } = require('./middleware/authMiddleware'); 
const { Op } = require('sequelize'); 

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Frontend URL
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// socket setup
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

initDb(); 

// endpoints

app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/refresh', authController.refresh); 
app.get('/api/auth/session', authController.checkSession);
app.post('/api/auth/logout', authController.logout);
app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = req.user.toJSON();
    const { password, refreshToken, ...rest } = user;
    res.json(rest);
});

// Doctors
app.get('/api/doctors', async (req, res) => {
    try {
        const doctors = await User.findAll({ where: { role: 'doctor' } });
        const safeDoctors = await Promise.all(doctors.map(async d => {
            const { password, ...rest } = d.toJSON();
            
            const comments = await Comment.findAll({ where: { doctorId: d.id } });
            let averageRating = null;
            if (comments.length > 0) {
                const sum = comments.reduce((acc, c) => acc + c.rating, 0);
                averageRating = parseFloat((sum / comments.length).toFixed(1));
            }
            
            return { ...rest, averageRating };
        }));
        res.json(safeDoctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/doctors/:id', async (req, res) => {
    try {
        const doctor = await User.findOne({ where: { id: req.params.id, role: 'doctor' } });
        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
        const { password, ...rest } = doctor.toJSON();
        res.json(rest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Availabilities
app.get('/api/availabilities', async (req, res) => {
    try {
        const { doctorId } = req.query;
        if (!doctorId) return res.status(400).json({ error: 'doctorId required' });
        
        const availabilities = await Availability.findAll({ where: { doctorId } });
        res.json(availabilities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/availabilities', async (req, res) => {
    try {
        const { doctorId, isCyclic, date, startDate, endDate, daysOfWeek, slots } = req.body;
        
        let timeSlots = slots;
        if (!timeSlots || timeSlots.length === 0) {
            if (req.body.startTime && req.body.endTime) {
                timeSlots = [{ startTime: req.body.startTime, endTime: req.body.endTime }];
            } else {
                return res.status(400).json({ error: 'Time slots required' });
            }
        }

        const existing = await Availability.findAll({ where: { doctorId } });
        
        const idsToDelete = [];

        const rangesOverlap = (start1, end1, start2, end2) => {
            return start1 <= end2 && start2 <= end1;
        };

        const newStart = isCyclic ? startDate : date;
        const newEnd = isCyclic ? endDate : date;
        let newDays = isCyclic ? daysOfWeek : [new Date(date).getDay()]; 
        
        const recordsToRecreate = [];

        for (const record of existing) {
            const recStart = record.isCyclic ? record.startDate : record.date;
            const recEnd = record.isCyclic ? record.endDate : record.date;

            if (rangesOverlap(newStart, newEnd, recStart, recEnd)) {
                let recDays = record.isCyclic ? record.daysOfWeek : [new Date(record.date).getDay()];

                const commonDays = recDays.filter(d => newDays.includes(d));

                if (commonDays.length > 0) {
                    idsToDelete.push(record.id);

                    const remainingDays = recDays.filter(d => !newDays.includes(d));
                    
                    if (remainingDays.length > 0) {
                        if (record.isCyclic) {
                            recordsToRecreate.push({
                                doctorId: record.doctorId,
                                isCyclic: true,
                                startDate: record.startDate,
                                endDate: record.endDate,
                                startTime: record.startTime,
                                endTime: record.endTime,
                                daysOfWeek: remainingDays
                            });
                        }
                    }
                }
            }
        }

        if (idsToDelete.length > 0) {
           await Availability.destroy({ where: { id: idsToDelete } });
        }

        for (const rec of recordsToRecreate) {
             await Availability.create(rec);
        }

        const created = [];
        for (const slot of timeSlots) {
             const entry = await Availability.create({
                 doctorId,
                 isCyclic,
                 date: isCyclic ? null : date,
                 startDate: isCyclic ? startDate : date, 
                 endDate: isCyclic ? endDate : date,
                 daysOfWeek: isCyclic ? daysOfWeek : [],
                 startTime: slot.startTime,
                 endTime: slot.endTime
             });
             created.push(entry);
        }

        io.emit('availability_update', { doctorId }); 
        res.status(201).json(created);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

//Absences
app.get('/api/absences', async (req, res) => {
    try {
        const { doctorId } = req.query;
        if (!doctorId) return res.status(400).json({ error: 'doctorId required' });

        const absences = await Absence.findAll({ where: { doctorId } });
        res.json(absences);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/absences', async (req, res) => {
    try {
        const absence = await Absence.create({
            ...req.body,
            id: req.body.id || require('uuid').v4() 
        });
        io.emit('absence_update', { doctorId: req.body.doctorId });
        res.status(201).json(absence);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Reservations
app.get('/api/reservations', async (req, res) => {
    try {
        const { doctorId, patientId } = req.query;
        let whereClause = {};
        if (doctorId) {
            whereClause.doctorId = doctorId;
        }
        if (patientId) {
            whereClause.patientId = patientId;
        }
        
        const reservations = await Reservation.findAll({ where: whereClause });
        res.json(reservations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/reservations', async (req, res) => {
    try {
        const { doctorId, startDateTime, endDateTime } = req.body;
        
        const overlapping = await Reservation.findOne({
            where: {
                doctorId,
                status: {
                    [Op.or]: ['confirmed', 'pending']
                },
                startDateTime: { [Op.lt]: endDateTime }, 
                endDateTime: { [Op.gt]: startDateTime }   
            }
        });

        if (overlapping) {
            return res.status(409).json({ error: 'Termin jest już zajęty lub trwa proces rezerwacji.' });
        }

        const reservation = await Reservation.create(req.body);
        
        io.emit('reservation_new', { 
            doctorId: reservation.doctorId, 
            reservation: reservation 
        });
        
        res.status(201).json(reservation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/reservations/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
        
        reservation.status = status;
        await reservation.save();
        
        io.emit('reservation_update', reservation);
        
        res.json(reservation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/reservations/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findByPk(req.params.id);
        if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
        
        await reservation.destroy();
        
        io.emit('reservation_cancelled', { id: req.params.id, doctorId: reservation.doctorId });
        
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Admin - users
app.get('/api/users', authenticateToken, authorizeRoles('admin'), dataController.getAllUsers);
app.delete('/api/users/:userId', authenticateToken, authorizeRoles('admin'), dataController.deleteUser);
app.patch('/api/users/:userId/ban', authenticateToken, authorizeRoles('admin'), dataController.banUser);
app.patch('/api/users/:userId/unban', authenticateToken, authorizeRoles('admin'), dataController.unbanUser);
// Admin - Comments
app.get('/api/comments', authenticateToken, authorizeRoles('admin'), dataController.getAllComments);
app.delete('/api/comments/:commentId', authenticateToken, authorizeRoles('admin'), dataController.deleteComment);

//Comments
app.post('/api/comments', authenticateToken, dataController.addComment);
app.get('/api/comments/:doctorId', dataController.getDoctorComments);
app.post('/api/comments/:commentId/reply', authenticateToken, authorizeRoles('doctor'), dataController.replyToComment);

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log('User connected socket:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start Server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
