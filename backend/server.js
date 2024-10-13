const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());


app.use(express.static(path.join(__dirname, 'backend')));


app.get('/hotel_bookings_1000.csv', (req, res) => {
    const csvFilePath = path.join(__dirname, 'hotel_bookings_1000.csv'); // Correct path
    res.sendFile(csvFilePath);
}); 


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});