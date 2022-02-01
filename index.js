import express from 'express';
import fetch from 'node-fetch';
import redis from 'redis';

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient({ 
    host: '172.31.35.219',
    port: 6379,
});

await client.connect();

const app = express(); 

//set response 
function setResponse(username, repos){
    return `<h1>${username} has ${repos} Github repos </h1>`;
}


//make request to github for data 
async function getRepos(req,res,next){
 try{
    console.log("fetching data...");

    const { username } = req.params;

    const response = await fetch(`https://api.github.com/users/${username}`);

    const data = await response.json();

    const repos = data.public_repos;

    //set data to redis 
    client.set(username, repos);

    res.send(setResponse(username, repos));

 } catch(err){
     console.error(err);
     res.status(500);
 }
}

//cache middleware 
async function cache(req,res,next){
    const { username } = req.params;

    const data = await client.get(username);
    if(data !== null){
        res.send(setResponse(username,data));
    }else{
        next();
    }
}

app.get('/repos/:username', cache, getRepos);


app.listen(5000, () => {
    console.log(`App listening on port ${PORT}`);
});