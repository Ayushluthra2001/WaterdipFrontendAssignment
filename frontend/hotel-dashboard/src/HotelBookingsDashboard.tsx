import React, { useEffect, useState } from 'react';
import flatpickr from 'flatpickr';
import ApexCharts from 'apexcharts';
import 'flatpickr/dist/flatpickr.css';
import Papa from 'papaparse';

interface BookingData {
    hotel: string;
    arrival_date_year: number;
    arrival_date_month: string;
    arrival_date_day_of_month: number;
    adults: number;
    children: number;
    babies: number;
    country: string;
}

const HotelBookingsDashboard: React.FC = () => {
    const [data, setData] = useState<BookingData[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:5000/hotel_bookings_1000.csv');
                const text = await response.text();
                Papa.parse(text, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (result: { data: BookingData[] }) => {
                        setData(result.data);
                    },
                });
            } catch (error) {
                console.error('Error fetching CSV data:', error);
            }
        };
        fetchData();
    }, []);

    const initializeChart = (elementId: string, options: any) => {
        const chart = new ApexCharts(document.querySelector(elementId), options);
        chart.render();
        return chart;
    };

    const timeSeriesChartOptions = {
        chart: { type: 'line', height: 350, zoom: { autoScaleYaxis: true } },
        series: [{ name: 'Visitors', data: [] }],
        xaxis: { type: 'datetime' },
        title: { text: 'Number of Visitors per Day', align: 'left' },
        annotations: {
            yaxis: [{
                y: 0,
                borderColor: '#FFFFFF',
                label: {
                    show: true,
                    text: 'Visitors: ',
                    style: {
                        color: '#FFFFFF',
                        background: '#007bff',
                        border: '1px solid #007bff',
                    },
                },
            }],
        },
    };

    const columnChartOptions = {
        chart: { type: 'bar', height: 350 },
        series: [{ name: 'Visitors', data: [] }],
        xaxis: { type: 'category', categories: [] },
        title: { text: 'Number of Visitors per Country', align: 'left' },
        annotations: {
            yaxis: [{
                y: 0,
                borderColor: '#FFFFFF',
                label: {
                    show: true,
                    text: 'Visitors: ',
                    style: {
                        color: '#FFFFFF',
                        background: '#007bff',
                        border: '1px solid #007bff',
                    },
                },
            }],
        },
    };

    const sparklineChartOptions = (name: string) => ({
        chart: { type: 'line', height: 160, sparkline: { enabled: true } },
        series: [{ name, data: [] }],
        title: { text: `${name} Visitors`, align: 'left', style: { fontSize: '14px' } },
    });

    let timeSeriesChart: any;
    let columnChart: any;
    let sparklineAdults: any;
    let sparklineChildren: any;

    const filterData = (startDate: Date, endDate: Date) => {
        return data.filter((record: BookingData) => {
            const recordDate = new Date(
                record.arrival_date_year,
                new Date(Date.parse(record.arrival_date_month + " 1, 2000")).getMonth(),
                record.arrival_date_day_of_month
            );
            return recordDate >= startDate && recordDate <= endDate;
        });
    };

    const aggregateVisitorsPerDay = (filteredData: BookingData[]) => {
        const visitorsPerDay: { [key: string]: number } = {};
        filteredData.forEach((record: BookingData) => {
            const dateKey = `${record.arrival_date_year}-${String(new Date(Date.parse(record.arrival_date_month + " 1, 2000")).getMonth() + 1).padStart(2, '0')}-${String(record.arrival_date_day_of_month).padStart(2, '0')}`;
            if (!visitorsPerDay[dateKey]) {
                visitorsPerDay[dateKey] = 0;
            }
            visitorsPerDay[dateKey] += record.adults + record.children + record.babies;
        });

        const sortedDates = Object.keys(visitorsPerDay).sort();
        return sortedDates.map((date) => {
            const totalVisitors = visitorsPerDay[date];
            return { x: new Date(date).getTime(), y: isFinite(totalVisitors) ? totalVisitors : 0 };
        });
    };

    const aggregateVisitorsPerCountry = (filteredData: BookingData[]) => {
        const visitorsPerCountry: { [key: string]: number } = {};
        filteredData.forEach((record: BookingData) => {
            if (!visitorsPerCountry[record.country]) {
                visitorsPerCountry[record.country] = 0;
            }
            visitorsPerCountry[record.country] += record.adults + record.children + record.babies;
        });

        return Object.keys(visitorsPerCountry).map((country) => {
            const totalVisitors = visitorsPerCountry[country];
            return { name: country, data: isFinite(totalVisitors) ? totalVisitors : 0 };
        });
    };

    const updateCharts = (startDate: Date, endDate: Date) => {
        const filteredData = filterData(startDate, endDate);
        const visitorsPerDay = aggregateVisitorsPerDay(filteredData);
        if (visitorsPerDay.length > 0) {
            timeSeriesChart.updateSeries([{ data: visitorsPerDay }]);
        } else {
            timeSeriesChart.updateSeries([{ data: [[0, 0]] }]);
        }

        const visitorsPerCountry = aggregateVisitorsPerCountry(filteredData);
        const countries = visitorsPerCountry.map((item) => item.name);
        const visitorsData = visitorsPerCountry.map((item) => item.data);

        if (countries.length > 0 && visitorsData.length > 0) {
            columnChart.updateOptions({
                xaxis: { categories: countries },
                series: [{ name: 'Visitors', data: visitorsData }],
            });
        } else {
            columnChart.updateOptions({
                xaxis: { categories: [] },
                series: [{ name: 'Visitors', data: [0] }],
            });
        }

        const adultsData = filteredData.map(record => record.adults);
        const childrenData = filteredData.map(record => record.children);

        if (adultsData.length > 0) {
            sparklineAdults.updateSeries([{ data: adultsData }]);
        } else {
            sparklineAdults.updateSeries([{ data: [0] }]);
        }

        if (childrenData.length > 0) {
            sparklineChildren.updateSeries([{ data: childrenData }]);
        } else {
            sparklineChildren.updateSeries([{ data: [0] }]);
        }
    };

    useEffect(() => {
        flatpickr('#dateRange', {
            mode: 'range',
            dateFormat: 'Y-m-d',
            defaultDate: ['2015-06-1', '2015-06-16'],
            onChange: function (selectedDates: Date[]) {
                if (selectedDates.length === 2) {
                    const [start, end] = selectedDates;
                    updateCharts(start, end);
                }
            },
        });

        timeSeriesChart = initializeChart('#timeSeriesChart', timeSeriesChartOptions);
        columnChart = initializeChart('#columnChart', columnChartOptions);
        sparklineAdults = initializeChart('#sparklineAdults', sparklineChartOptions('Adults'));
        sparklineChildren = initializeChart('#sparklineChildren', sparklineChartOptions('Children'));

        const initialStartDate = new Date('2015-03-1');
        const initialEndDate = new Date('2015-07-31');
        updateCharts(initialStartDate, initialEndDate);

        return () => {
            if (timeSeriesChart) timeSeriesChart.destroy();
            if (columnChart) columnChart.destroy();
            if (sparklineAdults) sparklineAdults.destroy();
            if (sparklineChildren) sparklineChildren.destroy();
        };
    }, [data]);

    return (
        <div className="container">
            <h1>Hotel Bookings Dashboard</h1>
            <div className="controls">
                <input id="dateRange" type="text" placeholder="Select Date Range" />
            </div>
            <div className="charts">
                <div id="timeSeriesChart" className="chart"></div>
                <div id="columnChart" className="chart"></div>
                <div className="sparklines">
                    <div id="sparklineAdults" className="sparkline"></div>
                    <div id="sparklineChildren" className="sparkline"></div>
                </div>
            </div>
            <style>{`
                            body {
                    font-family: 'Arial', sans-serif;
                    background-color: rgb(41, 70, 70);
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 900px;
                    margin: auto;
                    padding: 30px;
                    background-color: #ffffff;
                    border-radius: 10px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    text-align: center; /* Center the heading */
                }
                .controls {
                    margin-bottom: 30px;
                    display: flex;
                    justify-content: center; /* Center the date range picker */
                    gap: 10px;
                }
                .chart {
                    margin-bottom: 50px;
                }
                .sparklines {
                    display: flex;
                    justify-content: space-between;
                }
                .sparkline {
                    flex: 1;
                    margin-right: 20px;
                }

            `}</style>
        </div>
    );
};

export default HotelBookingsDashboard;
