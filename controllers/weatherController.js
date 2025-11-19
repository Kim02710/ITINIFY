const axios = require('axios');

const getWeather = async (req, res) => {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }

    try {
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
        );

        const forecastsByDay = {};

        response.data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toISOString().split('T')[0];

            if (!forecastsByDay[dayKey]) {
                forecastsByDay[dayKey] = {
                    temps: [],
                    winds: [],
                    weathers: {},
                    rainTimestamps: []
                };
            }

            forecastsByDay[dayKey].temps.push(item.main.temp);
            forecastsByDay[dayKey].winds.push(item.wind.speed);
            
            const weatherMain = item.weather[0].main;
            forecastsByDay[dayKey].weathers[weatherMain] = (forecastsByDay[dayKey].weathers[weatherMain] || 0) + 1;

            if (weatherMain === 'Rain' || weatherMain === 'Drizzle' || weatherMain === 'Thunderstorm') {
                forecastsByDay[dayKey].rainTimestamps.push(date);
            }
        });

        const processedForecasts = Object.keys(forecastsByDay).map(dayKey => {
            const dayData = forecastsByDay[dayKey];
            const date = new Date(dayKey + 'T00:00:00');

            const avgTemp = dayData.temps.reduce((a, b) => a + b, 0) / dayData.temps.length;
            const avgWind = dayData.winds.reduce((a, b) => a + b, 0) / dayData.winds.length;
            const dominantWeather = Object.keys(dayData.weathers).reduce((a, b) => dayData.weathers[a] > dayData.weathers[b] ? a : b);
            
            let rainTimeRange = null;
            if (dayData.rainTimestamps.length > 0) {
                const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                const firstRain = formatTime(dayData.rainTimestamps[0]);
                const lastRain = formatTime(dayData.rainTimestamps[dayData.rainTimestamps.length - 1]);
                rainTimeRange = `${firstRain} - ${lastRain}`;
            }

            return {
                dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
                formattedDate: date.toLocaleDateString('en-US', { day: 'numeric', month: 'long' }),
                avgTemp: Math.round(avgTemp),
                windSpeed: Math.round(avgWind * 3.6), // m/s to km/h
                weatherMain: dominantWeather,
                weatherDescription: dominantWeather, // Simplified for now
                rainProbability: Math.round((dayData.rainTimestamps.length / (response.data.list.length / Object.keys(forecastsByDay).length)) * 100),
                rainTimeRange: rainTimeRange
            };
        });

        res.status(200).json({ forecasts: processedForecasts });

    } catch (error) {
        console.error('Weather API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Failed to fetch weather forecast data.' });
    }
};

module.exports = { getWeather };
