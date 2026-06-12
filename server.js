const express = require("express");
const axios = require("axios");
const cors = require("cors");
const Redis=require("redis")

const redisClient = Redis.createClient()// can pass url if we are using url for my website 
// for now we are passsing nothing to make sure redsi is using localhost server.js file
const DEFAULT_EXPIRATION=3600// ttl default
const app = express();
app.use(cors());

// block below this helps for redis connections 
redisClient.on("error", (err) => {
    console.log("Redis Error:", err);
});

(async () => {
    await redisClient.connect();
    console.log("Redis Connected");
})();

// app.get("/photos", async (req, res) => {
//     const albumId = req.query.albumId;

//     const { data } = await axios.get(
//         "https://jsonplaceholder.typicode.com/photos",// api call jsut to simulate getting or fetching of large amount of data to pull so that i can tract teh time taken for the response
//         {
//             params: { albumId }
//         }
//     );

//     res.json(data);
// });


app.get("/photos", async (req, res) => {
    // header names are always lowercased
    try{
    const albumId = req.headers.albumid;//req.headers to read the headers of album  in the psotman requst
    //     console.log("query =", req.query);

    const photos=await getOrSetCache(`photos?albumId=${albumId}`,async()=>{
        
            const { data } = await axios.get(
        "https://jsonplaceholder.typicode.com/photos",// api call just to simulate getting or fetching of large amount of data to pull so that i can tract teh time taken for the response
        {
            params: { albumId }
        })
        return data;
    })
    res.json(photos)}
    catch(error)
    {
 console.error(error);
        res.status(500).send("Server Error");
    }
//     try{
//     const photos=await redisClient.get(`photos?albumId=${albumId}`);//async function so wait
//       // but redisClient.get('photos') caches the whole photos album but retrieving one photot from the album will surely giev whole thing again which is extra info
//       // so we have to take acare of everthing that changes like we should also be able to retrieve the single photo from the album not like getting the whole album whenever asked for the whole photo
// console.log("albumId =", albumId);
//       //so albumID? has been added to the query 
//         if(photos !=null){
//             console.log("Cache hit");
//             return res.json(JSON.parse(photos))
//             // this block tells if already in redis dont need to fetch again just return the redis values

//         }else{
//             // if not actually get this info from the api call 
//             console.log("Cache miss");


//             const { data } = await axios.get(
//         "https://jsonplaceholder.typicode.com/photos",// api call just to simulate getting or fetching of large amount of data to pull so that i can tract teh time taken for the response
//         {
//             params: { albumId }
//         }
//     );
// await redisClient.setEx(
//     `photos?albumId=${albumId}`,
//     DEFAULT_EXPIRATION,
//     JSON.stringify(data)
// )


        
//             res.json(data);

//     }// this block tells if already in redis dont need to fetch again just return the redis values
//     }catch(error){
//         console.error(errror);
//         res.status(500).send("SERVER ERROR")
//     }

    
});


app.get("/photos/:id", async (req, res) => {
     try{


    const photo=await getOrSetCache(`photos:${req.params.id}`,async()=>{
        
            const { data } = await axios.get(
        `https://jsonplaceholder.typicode.com/photos/${req.params.id}`)// api call just to simulate getting or fetching of large amount of data to pull so that i can tract teh time taken for the response
    
        return data;
    })
    res.json(photo)}
    catch(error)
    {
 console.error(error);
        res.status(500).send("Server Error");
    }
});

// Generic function to get data from Redis cache.
// If data is not found in cache, fetch fresh data using the callback function.
// function getOrSetCache(key, cb) {

//     return new Promise((resolve, reject) => {

//         // Check whether the key exists in Redis
//         redisClient.get(key, async (error, data) => {

//             // If Redis throws an error, reject the Promise
//             if (error) {
//                 return reject(error);
//             }

//             // Cache Hit
//             // If data exists in Redis, return it immediately
//             if (data != null) {
//                 return resolve(JSON.parse(data));
//             }

//             // Cache Miss
//             // Call the callback function to fetch fresh data
//             const freshData = await cb();

//             // Store the fresh data in Redis with TTL
//             redisClient.setEx(
//                 key,
//                 DEFAULT_EXPIRATION,
//                 JSON.stringify(freshData)
//             );

//             // Return the fresh data to the caller
//             resolve(freshData);
//         });
//     });
// }// redis v4 compatible call back
async function getOrSetCache(key, cb) {
    
console.log("Checking Redis:", key);
    // Check whether the key exists in Redis
    const data = await redisClient.get(key);

    // Cache Hit
    if (data != null) {
        return JSON.parse(data);
    }
 console.log("Cache Miss");
    // Cache Miss
    const freshData = await cb();
        console.log("Saving to Redis");

    await redisClient.setEx(
        key,
        DEFAULT_EXPIRATION,
        JSON.stringify(freshData)
    );

    return freshData;
}

app.listen(3000, () => {
    console.log("Server running on port 3000");
});