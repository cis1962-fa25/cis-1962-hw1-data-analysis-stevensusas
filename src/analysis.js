/**
 * Step 0: Import the dependencies, fs and papaparse
 */
const fs = require('fs');
const Papa = require('papaparse');

/**
 * Step 1: Parse the Data
 *      Parse the data contained in a given file into a JavaScript objectusing the modules fs and papaparse.
 *      According to Kaggle, there should be 2514 reviews.
 * @param {string} filename - path to the csv file to be parsed
 * @returns {Object} - The parsed csv file of app reviews from papaparse.
 */
function parseData(filename) {
    // use fs to read the csv file
    const csvData = fs.readFileSync(filename, 'utf8');

    // use papa parse to parse the csv data
    const parsed = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
    });

    return parsed;
}

/**
 * Step 2: Clean the Data
 *      Filter out every data record with null column values, ignore null gender values.
 *
 *      Merge all the user statistics, including user_id, user_age, user_country, and user_gender,
 *          into an object that holds them called "user", while removing the original properties.
 *
 *      Convert review_id, user_id, num_helpful_votes, and user_age to Integer
 *
 *      Convert rating to Float
 *
 *      Convert review_date to Date
 * @param {Object} csv - a parsed csv file of app reviews
 * @returns {Object} - a cleaned csv file with proper data types and removed null values
 */
function cleanData(csv) {
    // Filter out records with null values (except user_gender)
    const filteredData = csv.data.filter((row) => {
        // Check all columns except user_gender for null/empty values
        const requiredFields = [
            'review_id',
            'app_name',
            'app_category',
            'review_text',
            'review_language',
            'rating',
            'review_date',
            'verified_purchase',
            'device_type',
            'num_helpful_votes',
            'user_id',
            'user_age',
            'user_country',
            'app_version',
        ];

        return requiredFields.every((field) => {
            const value = row[field];
            return value !== null && value !== undefined && value !== '';
        });
    });

    // Clean and transform the data
    const cleanedData = filteredData.map((row) => {
        return {
            review_id: parseInt(row.review_id),
            app_name: row.app_name,
            app_category: row.app_category,
            review_text: row.review_text,
            review_language: row.review_language,
            rating: parseFloat(row.rating),
            review_date: new Date(row.review_date),
            verified_purchase: row.verified_purchase === 'True',
            device_type: row.device_type,
            num_helpful_votes: parseInt(row.num_helpful_votes),
            app_version: row.app_version,
            user: {
                user_id: parseInt(row.user_id),
                user_age: parseFloat(row.user_age),
                user_country: row.user_country,
                user_gender: row.user_gender,
            },
        };
    });

    return cleanedData;
}

/**
 * Step 3: Sentiment Analysis
 *      Write a function, labelSentiment, that takes in a rating as an argument
 *      and outputs 'positive' if rating is greater than 4, 'negative' is rating is below 2,
 *      and 'neutral' if it is between 2 and 4.
 * @param {Object} review - Review object
 * @param {number} review.rating - the numerical rating to evaluate
 * @returns {string} - 'positive' if rating is greater than 4, negative is rating is below 2,
 *                      and neutral if it is between 2 and 4.
 */
function labelSentiment({ rating }) {
    // assign sentiment based on rating
    if (rating > 4.0) {
        return 'positive';
    } else if (rating < 2.0) {
        return 'negative';
    } else {
        return 'neutral';
    }
}

/**
 * Step 3: Sentiment Analysis by App
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each app into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{app_name: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for an app
 */
function sentimentAnalysisApp(cleaned) {
    // Create a map to store sentiment counts for each app
    const appSentiments = {};

    // Process each review
    cleaned.forEach((review) => {
        const sentiment = labelSentiment({ rating: review.rating });
        const appName = review.app_name;

        // Initialize app entry if it doesn't exist
        if (!appSentiments[appName]) {
            appSentiments[appName] = {
                app_name: appName,
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        }

        // Increment the appropriate sentiment count
        appSentiments[appName][sentiment]++;
    });

    // Convert the map to an array
    return Object.values(appSentiments);
}

/**
 * Step 3: Sentiment Analysis by Language
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each language into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{lang_name: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for a language
 */
function sentimentAnalysisLang(cleaned) {
    // Create a map to store sentiment counts for each language
    const langSentiments = {};

    // Process each review
    cleaned.forEach((review) => {
        const sentiment = labelSentiment({ rating: review.rating });
        const langName = review.review_language;

        // Initialize language entry if it doesn't exist
        if (!langSentiments[langName]) {
            langSentiments[langName] = {
                lang_name: langName,
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        }

        // Increment the appropriate sentiment count
        langSentiments[langName][sentiment]++;
    });

    // Convert the map to an array
    return Object.values(langSentiments);
}

/**
 * Step 4: Statistical Analysis
 *      Answer the following questions:
 *
 *      What is the most reviewed app in this dataset, and how many reviews does it have?
 *
 *      For the most reviewed app, what is the most commonly used device?
 *
 *      For the most reviewed app, what the average star rating (out of 5.0)?
 *
 *      Add the answers to a returned object, with the format specified below.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{mostReviewedApp: string, mostReviews: number, mostUsedDevice: String, mostDevices: number, avgRating: float}} -
 *          the object containing the answers to the desired summary statistics, in this specific format.
 */
function summaryStatistics(cleaned) {
    // Count reviews by app
    const appReviewCounts = {};
    cleaned.forEach((review) => {
        const appName = review.app_name;
        if (!appReviewCounts[appName]) {
            appReviewCounts[appName] = 0;
        }
        appReviewCounts[appName]++;
    });

    // Find the most reviewed app
    let mostReviewedApp = '';
    let mostReviews = 0;

    for (const [appName, count] of Object.entries(appReviewCounts)) {
        if (count > mostReviews) {
            mostReviews = count;
            mostReviewedApp = appName;
        }
    }

    // Filter reviews for the most reviewed app
    const mostReviewedAppReviews = cleaned.filter(
        (review) => review.app_name === mostReviewedApp,
    );

    // Count devices for the most reviewed app
    const deviceCounts = {};
    let totalRating = 0;

    mostReviewedAppReviews.forEach((review) => {
        const device = review.device_type;
        if (!deviceCounts[device]) {
            deviceCounts[device] = 0;
        }
        deviceCounts[device]++;
        totalRating += review.rating;
    });

    // Find the most commonly used device
    let mostUsedDevice = '';
    let mostDevices = 0;

    for (const [device, count] of Object.entries(deviceCounts)) {
        if (count > mostDevices) {
            mostDevices = count;
            mostUsedDevice = device;
        }
    }

    // Calculate average rating
    const avgRating = totalRating / mostReviewedAppReviews.length;

    return {
        mostReviewedApp,
        mostReviews,
        mostUsedDevice,
        mostDevices,
        avgRating,
    };
}

/**
 * Do NOT modify this section!
 */
module.exports = {
    parseData,
    cleanData,
    sentimentAnalysisApp,
    sentimentAnalysisLang,
    summaryStatistics,
    labelSentiment,
};
