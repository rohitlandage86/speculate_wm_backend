const pool = require('../../../db')
//error 422 handler
error422 = (message, res) => {
  return res.status(422).json({
    status: 422,
    message: message
  })
}
//error 500 handler
error500 = (error, res) => {
  console.log(error)
  return res.status(500).json({
    status: 500,
    message: 'Internal Server Error',
    error: error
  })
}
//create betting market
const createBettingMarket = async (req, res) => {
  const sport_id = req.body.sport_id ? req.body.sport_id : null
  const betting_market_type_record_id = req.body.betting_market_type_record_id
    ? req.body.betting_market_type_record_id
    : null
  const betting_bet_type_record_id = req.body.betting_bet_type_record_id
    ? req.body.betting_bet_type_record_id
    : null
  const betting_period_type_record_id = req.body.betting_period_type_record_id
    ? req.body.betting_period_type_record_id
    : null
  const untitled_id = req.companyData.untitled_id

  if (!sport_id) {
    return error422('Sport id is required.', res)
  } else if (!betting_market_type_record_id) {
    return error422('Betting market type is required.', res)
  } else if (!betting_bet_type_record_id) {
    return error422('Betting bet type is required.', res)
  } else if (!betting_period_type_record_id) {
    return error422('Betting period type is required.', res)
  } else if (!untitled_id) {
    return error422('Untitled id is required.', res)
  }
  // let connection
  try {
    connection = await pool.connect()
    //check is market type record id  exist
    let checkMarketTypeExist =
      'SELECT * FROM betting_markets WHERE betting_market_type_record_id = $1 AND sport_id = $2'
    let marketTypeResult = await connection.query(checkMarketTypeExist, [
      betting_market_type_record_id,
      sport_id
    ])
    if (marketTypeResult.rowCount > 0) {
      return error422('Market type already exist.', res)
    }
    //check is  bettting  bet type record id exist
    let checkBettingBetTypeExist =
      'SELECT * FROM betting_markets WHERE betting_bet_type_record_id = $1 AND sport_id = $2'
    let bettingBetTypeResult = await connection.query(checkBettingBetTypeExist, [
      betting_bet_type_record_id,
      sport_id
    ])
    if (bettingBetTypeResult.rowCount > 0) {
      return error422('Betting bet type already exist.', res)
    }

    //insert betting market table
    const bettingMarketQuery =
      'INSERT INTO betting_markets (sport_id, betting_market_type_record_id, betting_bet_type_record_id, betting_period_type_record_id, untitled_id) VALUES ($1, $2, $3, $4, $5)'
    await connection.query(bettingMarketQuery, [
      sport_id,
      betting_market_type_record_id,
      betting_bet_type_record_id,
      betting_period_type_record_id,
      untitled_id
    ])
    return res.status(200).json({
      status: 200,
      message: 'Betting market created successfully.'
    })
  } catch (error) {
    error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
//get betting markets list...
const getBettingMarkets = async (req, res) => {
  const { page, perPage, key } = req.query
  let connection
  try {
    connection = await pool.connect()
    let query = `SELECT bm.*, s.sports_name, s.small_name , mt.name AS betting_market_type, bt.name AS betting_bet_type, pt.name AS betting_period_type
    FROM betting_markets bm 
    LEFT JOIN sports s 
    ON s.sport_id = bm.sport_id 
    LEFT JOIN betting_market_types mt 
    ON mt.record_id = bm.betting_market_type_record_id
    LEFT JOIN betting_bet_types bt 
    ON bt.record_id = bm.betting_bet_type_record_id
    LEFT JOIN betting_period_types pt 
    ON pt.record_id = bm.betting_period_type_record_id
    `
    let countQuery = `SELECT COUNT(*) AS total 
    FROM betting_markets bm 
    LEFT JOIN sports s 
    ON s.sport_id = bm.sport_id 
    LEFT JOIN betting_market_types mt 
    ON mt.record_id = bm.betting_market_type_record_id
    LEFT JOIN betting_bet_types bt 
    ON bt.record_id = bm.betting_bet_type_record_id
    LEFT JOIN betting_period_types pt 
    ON pt.record_id = bm.betting_period_type_record_id
    `
    if (key) {
      const lowercaseKey = key.toLowerCase().trim()
      if (key === 'activated') {
        query += ' WHERE bm.status = 1'
        countQuery += ' WHERE bm.status = 1'
      } else if (key === 'deactivated') {
        query += ' WHERE bm.status = 0'
        countQuery += ' WHERE bm.status = 0'
      } else {
        query += ` WHERE LOWER(s.sports_name) LIKE '%${lowercaseKey}%' `
        countQuery += ` WHERE LOWER(s.sports_name) LIKE '%${lowercaseKey}%' `
      }
    }

    query += ' ORDER BY bm.cts DESC'
    let total = 0
    // Apply pagination if both page and perPage are provided
    if (page && perPage) {
      const totalResult = await connection.query(countQuery)
      total = parseInt(totalResult.rows[0].total)

      const start = (page - 1) * perPage
      query += ` LIMIT '${perPage}' OFFSET '${start}'`
    }
    const result = await connection.query(query)
    const bettingMarkets = result.rows
    const data = {
      status: 200,
      message: 'Betting markets retrieved successfully',
      data: bettingMarkets
    }
    // Add pagination information if provided
    if (page && perPage) {
      data.pagination = {
        per_page: perPage,
        total: total,
        current_page: page,
        last_page: Math.ceil(total / perPage)
      }
    }
    return res.status(200).json(data)
  } catch (error) {
    error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}

//get betting market  by id...
const getBettingMarket = async (req, res) => {
  const betting_market_id = parseInt(req.params.id)

  if (!betting_market_id) {
    return error422('Betting market id is required.', res)
  }
  let connection
  try {
    connection = await pool.connect()
    let query =
      `SELECT bm.*, s.sports_name, s.small_name , mt.name AS betting_market_type, bt.name AS betting_bet_type, pt.name AS betting_period_type
      FROM betting_markets bm 
      LEFT JOIN sports s 
      ON s.sport_id = bm.sport_id 
      LEFT JOIN betting_market_types mt 
      ON mt.record_id = bm.betting_market_type_record_id
      LEFT JOIN betting_bet_types bt 
      ON bt.record_id = bm.betting_bet_type_record_id
      LEFT JOIN betting_period_types pt 
      ON pt.record_id = bm.betting_period_type_record_id
      WHERE bm.betting_market_id = $1`

    const result = await connection.query(query, [betting_market_id])
    if (result.rowCount === 0) {
      return error422('Betting market is Not Found', res)
    }
    let betting_markets = result.rows[0]
    const data = {
      status: 200,
      message: 'Betting market retrieved successfully',
      data: betting_markets
    }
    return res.status(200).json(data)
  } catch (error) {
    error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}

//update betting market
const updateBettingMarket = async (req, res) => {
  const betting_market_id = parseInt(req.params.id)
  const sport_id = req.body.sport_id ? req.body.sport_id : null
  const betting_market_type_record_id = req.body.betting_market_type_record_id
    ? req.body.betting_market_type_record_id
    : null
  const betting_bet_type_record_id = req.body.betting_bet_type_record_id
    ? req.body.betting_bet_type_record_id
    : null
  const betting_period_type_record_id = req.body.betting_period_type_record_id
    ? req.body.betting_period_type_record_id
    : null
  const untitled_id = req.companyData.untitled_id

  if (!sport_id) {
    return error422('Sport id is required.', res)
  } else if (!betting_market_type_record_id) {
    return error422('Betting market type is required.', res)
  } else if (!betting_bet_type_record_id) {
    return error422('betting bet is required .', res)
  } else if (!betting_market_id) {
    return error422('Betting market id is required.', res)
  } else if (!betting_period_type_record_id) {
    return error422('Betting period id is required.', res)
  } else if (!untitled_id) {
    return error422('Untitled id is required.', res)
  }

  let connection
  connection = await pool.connect()
  // check if betting market exists
  const checkBettingMarketQuery =
    'SELECT * FROM betting_markets WHERE betting_market_id = $1'
  const checkBettingMarketResult = await connection.query(
    checkBettingMarketQuery,
    [betting_market_id]
  )
  if (checkBettingMarketResult.rowCount === 0) {
    return error422('Betting market is Not Found', res)
  }
  //check is betting bet type exist
  const checkBettingBetTypeQuery =
    'SELECT * FROM betting_markets WHERE (betting_bet_type_record_id = $1 AND sport_id = $2 ) AND betting_market_id != $3'
  const checkBettingBetTypeResult = await connection.query(
    checkBettingBetTypeQuery,
    [betting_bet_type_record_id, sport_id, betting_market_id]
  )
  if (checkBettingBetTypeResult.rowCount > 0) {
    return error422('Betting bet type is already exist.', res)
  }

  // check is betting market type record id  exist
  const checkBettingMarketTypeQuery =
    'SELECT * FROM betting_markets WHERE (betting_market_type_record_id = $1 AND sport_id = $2) AND betting_market_id != $3'
  const checkBettingMarketTypeResult = await connection.query(
    checkBettingMarketTypeQuery,
    [betting_market_type_record_id, betting_market_id]
  )
  if (checkBettingMarketTypeResult.rowCount > 0) {
    return error422('Betting Market is already exist.', res)
  }
  try {
    //update the betting market type record with new data
    const updateQuery = `
      UPDATE betting_markets
      SET sport_id = $1, betting_market_type_record_id = $2, betting_bet_type_record_id = $3, betting_period_type_record_id = $4, untitled_id =$5
      WHERE betting_market_type_id = $6
      `
    const updateResult = await connection.query(updateQuery, [
      sport_id,
      betting_market_type_record_id,
      betting_bet_type_record_id,
      betting_period_type_record_id,
      untitled_id,
      betting_market_id
    ])

    return res.status(200).json({
      status: 200,
      message: 'Betting market updated successfully.'
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
//betting market status change
const onStatusChange = async (req, res) => {
  const bettingMarketId = parseInt(req.params.id)
  const status = parseInt(req.query.status) // Validate and parse the status parameter
  let connection
  connection = await pool.connect()
  try {
    // Check if the betting market exists
    const bettingMarketQuery =
      'SELECT * FROM betting_markets WHERE betting_market_id = $1'
    const bettingMarketResult = await connection.query(
      bettingMarketQuery,
      [bettingMarketId]
    )

    if (bettingMarketResult.rowCount === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Betting market not found.'
      })
    }

    // Validate the status parameter
    if (status !== 0 && status !== 1) {
      return res.status(400).json({
        status: 400,
        message:
          'Invalid status value. Status must be 0 (inactive) or 1 (active).'
      })
    }

    // Soft update the betting market status
    const updateQuery = `
            UPDATE betting_markets
            SET status = $1
            WHERE betting_market_id = $2
        `

    await connection.query(updateQuery, [status, bettingMarketId])

    const statusMessage = status === 1 ? 'activated' : 'deactivated'

    return res.status(200).json({
      status: 200,
      message: `Betting market ${statusMessage} successfully.`
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}
//get betting markets Wma...
const getBettingMarketsWma = async (req, res) => {
  let connection
  connection = await pool.connect()
  try {
    let query =
      'SELECT * FROM betting_markets WHERE status = 1 ORDER BY cts DESC'
    const result = await connection.query(query)
    const bettingMarkets = result.rows
    return res.status(200).json({
      status: 200,
      message: 'Betting market retrieved successfully.',
      data: bettingMarkets
    })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) connection.release()
  }
}

module.exports = {
  createBettingMarket,
  getBettingMarkets,
  getBettingMarket,
  updateBettingMarket,
  onStatusChange,
  getBettingMarketsWma
}
