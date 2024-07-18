const pool = require('../../../db')
const axios = require('axios');
//error 422 handler
error422 = (message, res) => {
    return res.status(422).json({
        status: 422,
        message: message
    })
}
//error 500 handler
error500 = (error, res) => {
    console.log(error);
    return res.status(500).json({
        status: 500,
        message: 'Internal Server Error',
        error: error
    })
}
const getSportsData = async (req, res) => {
    const { sport_id, betting_bet_type_id, current_date, betting_period_type_id, betting_market_type_id } = req.query;

    let AnyBetsAvailable = false;
    if (!sport_id) {
        return error422("Sport id is required", res);
    } else if (!betting_bet_type_id) {
        return error422("Betting bet type is required.", res)
    } else if (!current_date) {
        return error422("Current date is required.", res);
    } else if (!betting_period_type_id) {
        return error422("Betting Period type is required.", res)
    } else if (!betting_market_type_id) {
        return error422("Betting market type is required.", res)
    }
    let connection
    try {
        connection = await pool.connect()
        //sport id is exist...
        let isSportIdExistQuery = 'SELECT * FROM sports WHERE sport_id = $1'
        const isSportIdExistResult = await connection.query(isSportIdExistQuery, [sport_id])
        const sportData = isSportIdExistResult.rows[0]
        if (isSportIdExistResult.rowCount === 0) {
            return error422('Sport is Not Found', res)
        }
        //betting period type id is exist...
        let isBettingPeriodTypeIdExistQuery = 'SELECT * FROM betting_period_types WHERE betting_period_type_id = $1'
        const isBettingPeriodTypeIdExistResult = await connection.query(isBettingPeriodTypeIdExistQuery, [betting_period_type_id])
        const bettingPeriodTypeData = isBettingPeriodTypeIdExistResult.rows[0]
        if (isBettingPeriodTypeIdExistResult.rowCount === 0) {
            return error422('Betting period type is Not Found', res)
        }
        //betting bet type id is exist...
        let isBettingBetTypeIdExistQuery = 'SELECT * FROM betting_bet_types WHERE betting_bet_type_id = $1 AND sport_id = $2'
        const isBettingBetTypeIdExistResult = await connection.query(isBettingBetTypeIdExistQuery, [betting_bet_type_id, sport_id])
        const bettingBetTypeData = isBettingBetTypeIdExistResult.rows[0]
        if (isBettingBetTypeIdExistResult.rowCount === 0) {
            return error422('Betting bet type is Not Found', res)
        }
        //betting market type is exist...
        let isBettingMarketTypeExistQuery = `SELECT * FROM betting_market_types WHERE betting_market_type_id = $1 `
        const isBettingMarketTypeExistResult = await connection.query(isBettingMarketTypeExistQuery,[betting_market_type_id])
        const bettingMarketTypeData = isBettingMarketTypeExistResult.rows[0]
        if (isBettingMarketTypeExistResult.rowCount === 0) {
            return error422("Betting market type is Not Found.", res)
        }

        //betting event by date
        let response = [];
        let bettingMarkets = [];
        response = await axios.get(`https://api.sportsdata.io/v3/${sportData.small_name}/odds/json/BettingEventsByDate/${current_date}?key=${sportData.api_keys}`);
        if (response.data.length > 0) {
            for (let index = 0; index < response.data.length; index++) {
                const element = response.data[index];
                for (let bettingIndex = 0; bettingIndex < element.BettingMarkets.length; bettingIndex++) {
                    const BettingMarket = element.BettingMarkets[bettingIndex]
                    if (BettingMarket.BettingBetTypeID == bettingBetTypeData.record_id &&BettingMarket.AnyBetsAvailable == AnyBetsAvailable&&BettingMarket.BettingPeriodTypeID == bettingPeriodTypeData.record_id &&BettingMarket.BettingMarketTypeID == bettingMarketTypeData.record_id) {
                        bettingMarkets.push(BettingMarket)
                    }

                }
            }
        }
        res.json({
            status:200,
            message:"Betting markets data retrived successfully.",
            data: bettingMarkets
        });
    } catch (error) {
        error500(error, res)
    } finally {
        if (connection) connection.release()
    }
}

module.exports = {
    getSportsData
}