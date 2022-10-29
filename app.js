const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;
const app = express();
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3001, () => {
      console.log("Server is Running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};

initializeDbAndServer();

const playerObjToResponse = (player) => {
  return {
    playerId: player.player_id,
    playerName: player.player_name,
  };
};

const matchObjToResponse = (matches) => {
  return {
    matchId: matches.match_id,
    match: matches.match,
    year: matches.year,
  };
};

// const matchScoreObjToResponse=(matchScore)=>{
//     return{
//         player_match_id:matchScore.player,
//         player_id:matchScore.player
//         }
// }

//API 1 GET PLAYERS
app.get("/players/", async (request, response) => {
  //   const { playerId } = request.params;

  const getAllPlayers = `
    SELECT * 
    FROM 
    player_details 
    ORDER BY 
    player_id;`;

  const playerArray = await db.all(getAllPlayers);
  response.send(
    playerArray.map((eachPlayer) => playerObjToResponse(eachPlayer))
  );
});

//API 2 GET SPECIFIC PLAYER
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayer = `
    SELECT * 
    FROM 
    player_details
    WHERE 
    player_id='${playerId}';`;
  const specificPlayer = await db.get(getSpecificPlayer);
  response.send(playerObjToResponse(specificPlayer));
});

//API 3 UPDATE PLAYER
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayer = `
    UPDATE player_details
    SET
        player_name='${playerName}'
        WHERE 
        player_id='${playerId}';`;
  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

//API 4 GET MATCH DETAILS
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
    SELECT 
      * 
    FROM
    match_details
    WHERE 
    match_id=${matchId};`;
  const match = await db.get(getMatchDetails);
  response.send(matchObjToResponse(match));
});

//API 5 GET MATCHES OF PLAYERS
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const getMatchOfPlayer = `
    SELECT * 
    FROM 
   player_match_score  NATURAL JOIN
    match_details
    WHERE 
    player_id='${playerId}';`;
  const match = await db.all(getMatchOfPlayer);
  console.log(match);
  response.send(match.map((eachMatch) => matchObjToResponse(eachMatch)));
});

//API 6 GET PLAYERS OF MATCH

app.get("/matches/:matchId/players/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersOfMatch = `
    SELECT 
      *
    FROM player_details
    NATURAL JOIN player_match_score
    WHERE 
    player_id=${playerId};`;
  const playerMatch = await db.all(getPlayersOfMatch);
  response.send(
    playerMatch.map((eachPlayer) => matchObjToResponse(eachPlayer))
  );
});

//GET SCORES
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getScores = `
    SELECT 
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_match_score
    NATURAL JOIN player_details
    WHERE player_id='${playerId}';`;
  const scores = await db.get(getScores);
  response.send(scores);
});

module.exports = app;

//NATURAL JOIN player_details
