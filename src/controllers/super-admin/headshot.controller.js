const pool = require("../../../db");
const axios = require("axios");

// Error 422 handler
const error422 = (message, res) => {
  return res.status(422).json({
    status: 422,
    message: message,
  });
};

// Error 500 handler
const error500 = (error, res) => {
  console.log(error);
  return res.status(500).json({
    status: 500,
    message: "Internal Server Error",
    error: error,
  });
};

// Create headshot...
const getHeadShotData = async (req, res) => {
  let connection;
  try {
    connection = await pool.connect();

    // Check if sport ID exists...
    const isSportIdExistQuery = "SELECT * FROM sports WHERE sport_id = $1";
    const isSportIdExistResult = await connection.query(isSportIdExistQuery, [2]);
    const sportData = isSportIdExistResult.rows[0];

    if (isSportIdExistResult.rowCount === 0) {
      return error422("Sport is Not Found", res);
    }

    const response = await axios.get(
      `https://api.sportsdata.io/v3/${sportData.small_name}/headshots/json/Headshots?key=${sportData.api_keys}`
    );

    // Insert headshots into the database
    const insertHeadshotQuery = `
      INSERT INTO public.headshot (
        "PlayerID", sport_id, "Name", "TeamID", "Team", "Position",
        "PreferredHostedHeadshotUrl", "PreferredHostedHeadshotUpdated",
        "HostedHeadshotWithBackgroundUrl", "HostedHeadshotWithBackgroundUpdated",
        "HostedHeadshotNoBackgroundUrl", "HostedHeadshotNoBackgroundUpdated"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;

    for (const headshot of response.data) {
      try {
        // Extract only the date part from the timestamp
        const preferredUpdatedDate = headshot.PreferredHostedHeadshotUpdated
          ? headshot.PreferredHostedHeadshotUpdated.split('T')[0] + 'T00:00:00Z'
          : null;
        const backgroundUpdatedDate = headshot.HostedHeadshotWithBackgroundUpdated
          ? headshot.HostedHeadshotWithBackgroundUpdated.split('T')[0] + 'T00:00:00Z'
          : null;
        const noBackgroundUpdatedDate = headshot.HostedHeadshotNoBackgroundUpdated
          ? headshot.HostedHeadshotNoBackgroundUpdated.split('T')[0] + 'T00:00:00Z'
          : null;

        await connection.query(insertHeadshotQuery, [
          headshot.PlayerID,
          sportData.sport_id,
          headshot.Name,
          headshot.TeamID,
          headshot.Team,
          headshot.Position,
          headshot.PreferredHostedHeadshotUrl,
          preferredUpdatedDate, // Append time if needed
          headshot.HostedHeadshotWithBackgroundUrl,
          backgroundUpdatedDate, // Append time if needed
          headshot.HostedHeadshotNoBackgroundUrl,
          noBackgroundUpdatedDate, // Append time if needed
        ]);
      } catch (error) {
        console.error("Error inserting headshot:", headshot.PlayerID, error);
      }
    }

    return res.status(200).json({
      status: 200,
      message: "Headshots created and inserted successfully.",
      data: response.data, // Include the response data in the JSON response
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
