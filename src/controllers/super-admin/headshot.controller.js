const pool = require("../../../db");
const axios = require('axios');
//error 422 handler
error422 = (message, res) => {
  return res.status(422).json({
    status: 422,
    message: message,
  });
};
//error 500 handler
error500 = (error, res) => {
  console.log(error);
  return res.status(500).json({
    status: 500,
    message: "Internal Server Error",
    error: error,
  });
};
//create headshot...
const getHeadShotData = async (req, res) => {

  let connection;
  try {
    connection = await pool.connect();

  //sport id is exist...
  let isSportIdExistQuery = "SELECT * FROM sports WHERE sport_id = $1";
  const isSportIdExistResult = await connection.query(isSportIdExistQuery, [2])
  const sportData = isSportIdExistResult.rows[0]
  if (isSportIdExistResult.rowCount === 0) {
      return error422('Sport is Not Found', res)
  }

  
  let Headshot = [];
  let response = await axios.get(`https://api.sportsdata.io/v3/${sportData.small_name}/headshots/json/Headshots?key=${sportData.api_keys}`);
  // if (response.data.length > 0) {
  //     for (let index = 0; index < response.data.length; index++) {
  //         const element = response.data[index];
  //         // for (let bettingIndex = 0; bettingIndex < element.Headshot.length; bettingIndex++) {
  //         //     const Headshot = element.Headshot[bettingIndex]
  //         //     // if (BettingMarket.BettingBetTypeID == bettingBetTypeData.record_id &&BettingMarket.AnyBetsAvailable == AnyBetsAvailable&&BettingMarket.BettingPeriodTypeID == bettingPeriodTypeData.record_id &&BettingMarket.BettingMarketTypeID == bettingMarketTypeData.record_id) {
  //         //     //     bettingMarkets.push(BettingMarket)
  //         //     // }

  //         // }
  //     }
  // } 
    // Insert headshot 
    // const headshotQuery = `
    //   INSERT INTO headshot (
    //     sport_id, Name, TeamID, Team, Position,
    //     PreferredHostedHeadshotUrl, HostedHeadshotWithBackgroundUrl, HostedHeadshotNoBackgroundUrl
    //   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    // `;
    // await connection.query(headshotQuery, [
    //   sport_id,
    //   Name,
    //   TeamID,
    //   Team,
    //   Position,
    //   PreferredHostedHeadshotUrl,
    //   HostedHeadshotWithBackgroundUrl,
    //   HostedHeadshotNoBackgroundUrl,
    // ]);
  // console.log(safeStringify(response, 2));
  const obj = {};
obj.circular = obj;
// const jsonString = JSON.stringify(obj);
    return res.status(200).json({
      status: 200,
      message: "Headshot created successfully.",
      sport: JSON.stringify(obj)
      // data: response, 

    });

  } catch (error) {
    error500(error, res);
  } finally {
    if (connection) connection.release();
  }
};


module.exports = {
  getHeadShotData,

};
