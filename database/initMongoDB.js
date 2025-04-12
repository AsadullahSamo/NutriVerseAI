/**
 * MongoDB Initialization Script for Pakistan Agricultural Data
 * 
 * Mock data sourced from Open Data Pakistan
 * To be used for initial database population
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });

// Define the schema matching our model
const agriculturalDataSchema = new mongoose.Schema({
    year: {
        type: String,
        required: true
    },
    crop: {
        type: String,
        required: true
    },
    production: {
        type: Number,
        required: true
    },
    area: {
        type: Number,
        required: true
    },
    cropsYield: {
        type: Number,
        required: true
    },
    region: {
        type: String,
        required: true
    },
    source: {
        type: String,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Virtual property to maintain backward compatibility with 'yield'
agriculturalDataSchema.virtual('yield').get(function() {
    return this.cropsYield;
});

agriculturalDataSchema.virtual('yield').set(function(value) {
    this.cropsYield = value;
});

// Ensure virtuals are included when converting to JSON
agriculturalDataSchema.set('toJSON', { virtuals: true });
agriculturalDataSchema.set('toObject', { virtuals: true });

// Create the model
const AgriculturalData = mongoose.model('AgriculturalData', agriculturalDataSchema);

// Mock data from Open Data Pakistan
const mockData = [
    // Wheat data
    {
        year: "2019",
        crop: "Wheat",
        production: 24349000,
        area: 8740000,
        cropsYield: 2.79,
        region: "Punjab",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2019",
        crop: "Wheat",
        production: 3852000,
        area: 1154000,
        cropsYield: 3.34,
        region: "Sindh",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2019",
        crop: "Wheat",
        production: 945000,
        area: 490000,
        cropsYield: 1.93,
        region: "KPK",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2019",
        crop: "Wheat",
        production: 578000,
        area: 363000,
        cropsYield: 1.59,
        region: "Balochistan",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2020",
        crop: "Wheat",
        production: 25248000,
        area: 8809000,
        cropsYield: 2.87,
        region: "Punjab",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2020",
        crop: "Wheat",
        production: 4003000,
        area: 1167000,
        cropsYield: 3.43,
        region: "Sindh",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2020",
        crop: "Wheat",
        production: 978000,
        area: 503000,
        cropsYield: 1.94,
        region: "KPK",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2020",
        crop: "Wheat",
        production: 592000,
        area: 372000,
        cropsYield: 1.59,
        region: "Balochistan",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    
    // Rice data
    {
        year: "2019",
        crop: "Rice",
        production: 4883000,
        area: 2029000,
        cropsYield: 2.41,
        region: "Punjab",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2019",
        crop: "Rice",
        production: 2851000,
        area: 755000,
        cropsYield: 3.78,
        region: "Sindh",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2019",
        crop: "Rice",
        production: 152000,
        area: 57000,
        cropsYield: 2.67,
        region: "KPK",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2019",
        crop: "Rice",
        production: 547000,
        area: 179000,
        cropsYield: 3.06,
        region: "Balochistan",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2020",
        crop: "Rice",
        production: 5297000,
        area: 2153000,
        cropsYield: 2.46,
        region: "Punjab",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2020",
        crop: "Rice",
        production: 3036000,
        area: 782000,
        cropsYield: 3.88,
        region: "Sindh",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2020",
        crop: "Rice",
        production: 163000,
        area: 60000,
        cropsYield: 2.72,
        region: "KPK",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2020",
        crop: "Rice",
        production: 580000,
        area: 187000,
        cropsYield: 3.10,
        region: "Balochistan",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    
    // Cotton data
    {
        year: "2019",
        crop: "Cotton",
        production: 6856000,
        area: 5580000,
        cropsYield: 1.23,
        region: "Punjab",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2019",
        crop: "Cotton",
        production: 2461000,
        area: 1542000,
        cropsYield: 1.60,
        region: "Sindh",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2019",
        crop: "Cotton",
        production: 97000,
        area: 42000,
        cropsYield: 2.31,
        region: "Balochistan",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2020",
        crop: "Cotton",
        production: 5939000,
        area: 5352000,
        cropsYield: 1.11,
        region: "Punjab",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2020",
        crop: "Cotton",
        production: 1985000,
        area: 1484000,
        cropsYield: 1.34,
        region: "Sindh",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2020",
        crop: "Cotton",
        production: 103000,
        area: 44000,
        cropsYield: 2.34,
        region: "Balochistan",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    
    // Sugarcane data
    {
        year: "2019",
        crop: "Sugarcane",
        production: 47372000,
        area: 1039000,
        cropsYield: 45.59,
        region: "Punjab",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2019",
        crop: "Sugarcane",
        production: 18476000,
        area: 308000,
        cropsYield: 59.99,
        region: "Sindh",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2019",
        crop: "Sugarcane",
        production: 5329000,
        area: 116000,
        cropsYield: 45.94,
        region: "KPK",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2020",
        crop: "Sugarcane",
        production: 49273000,
        area: 1055000,
        cropsYield: 46.70,
        region: "Punjab",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2020",
        crop: "Sugarcane",
        production: 19145000,
        area: 316000,
        cropsYield: 60.59,
        region: "Sindh",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2020",
        crop: "Sugarcane",
        production: 5576000,
        area: 121000,
        cropsYield: 46.08,
        region: "KPK",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    
    // Maize data
    {
        year: "2019",
        crop: "Maize",
        production: 5289000,
        area: 818000,
        cropsYield: 6.47,
        region: "Punjab",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2019",
        crop: "Maize",
        production: 67000,
        area: 38000,
        cropsYield: 1.76,
        region: "Sindh",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2019",
        crop: "Maize",
        production: 897000,
        area: 463000,
        cropsYield: 1.94,
        region: "KPK",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2020",
        crop: "Maize",
        production: 5736000,
        area: 853000,
        cropsYield: 6.73,
        region: "Punjab",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2020",
        crop: "Maize",
        production: 72000,
        area: 41000,
        cropsYield: 1.76,
        region: "Sindh",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2020",
        crop: "Maize",
        production: 982000,
        area: 478000,
        cropsYield: 2.05,
        region: "KPK",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    
    // 2021 Data
    {
        year: "2021",
        crop: "Wheat",
        production: 26394000,
        area: 8976000,
        cropsYield: 2.94,
        region: "Punjab",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2021",
        crop: "Wheat",
        production: 4256000,
        area: 1189000,
        cropsYield: 3.58,
        region: "Sindh",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2021",
        crop: "Wheat",
        production: 1032000,
        area: 525000,
        cropsYield: 1.97,
        region: "KPK",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2021",
        crop: "Wheat",
        production: 623000,
        area: 385000,
        cropsYield: 1.62,
        region: "Balochistan",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2021",
        crop: "Rice",
        production: 5482000,
        area: 2213000,
        cropsYield: 2.48,
        region: "Punjab",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2021",
        crop: "Rice",
        production: 3156000,
        area: 803000,
        cropsYield: 3.93,
        region: "Sindh",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2021",
        crop: "Cotton",
        production: 5127000,
        area: 5162000,
        cropsYield: 0.99,
        region: "Punjab",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    },
    {
        year: "2021",
        crop: "Cotton",
        production: 1754000,
        area: 1396000,
        cropsYield: 1.26,
        region: "Sindh",
        source: "Open Data Pakistan",
        lastUpdated: new Date()
    }
];

// Function to initialize the database
const initDatabase = async () => {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pakistan-data', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB successfully');

        // Check if data already exists
        const count = await AgriculturalData.countDocuments();
        
        if (count > 0) {
            console.log(`Database already contains ${count} records. Skipping initialization.`);
            console.log('To reinitialize, please clear the collection first.');
        } else {
            // Insert mock data
            console.log('Initializing database with mock data from Open Data Pakistan...');
            await AgriculturalData.insertMany(mockData);
            console.log(`Successfully added ${mockData.length} agricultural data records to MongoDB`);
        }
    } catch (error) {
        console.error('Database initialization failed:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Run the initialization
initDatabase(); 