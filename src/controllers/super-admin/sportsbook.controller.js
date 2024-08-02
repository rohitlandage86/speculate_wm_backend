const pool = require('../../../db')
const fs = require('fs') // Required for file system operations
const path = require('path') // Required for working with file paths
//error handle 422...
error422 = (message, res) => {
  return res.status(422).json({
    status: 422,
    message: message
  })
}
//error handle 500...
error500 = (error, res) => {
  console.log(error)
  return res.status(500).json({
    status: 500,
    message: 'Internal Server Error',
    error: error
  })
}


//get sports book list...
const getSportsbooks = async (req, res) => {
  const { page, perPage, key } = req.query
  let connection
  try {
    connection = await pool.connect()
    let query = 'SELECT * FROM sportsbook'
    let countQuery = 'SELECT COUNT(*) AS total FROM sportsbook'
    if (key) {
      const lowercaseKey = key.toLowerCase().trim()
      if (key === 'activated') {
        query += ' WHERE status = 1'
        countQuery += ' WHERE status = 1'
      } else if (key === 'deactivated') {
        query += ' WHERE status = 0'
        countQuery += ' WHERE status = 0'
      } else {
        query += ` WHERE LOWER(Name) LIKE '%${lowercaseKey}%'`
        countQuery += ` WHERE LOWER(Name) LIKE '%${lowercaseKey}%'`
      }
    }
    query += ' ORDER BY cts DESC'
    let total = 0
    // Apply pagination if both page and perPage are provided
    if (page && perPage) {
      const totalResult = await connection.query(countQuery)
      total = parseInt(totalResult.rows[0].total)

      const start = (page - 1) * perPage
      query += ` LIMIT '${perPage}' OFFSET '${start}'`
    }
    const result = await connection.query(query)
    const sportsbook = result.rows
    const data = {
      status: 200,
      message: 'Sports book retrieved successfully',
      data: sportsbook
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
    if (connection) {
      await connection.release()
    }
  }
}

//get sports book data by id...
const getSportsbook = async (req, res) => {
    const SportsbookID = parseInt(req.params.id)
    if (!SportsbookID) {
        return error422("Sports book id is required.", res)
    }

    let connection
    try {
        connection = await pool.connect()
        let query = 'SELECT * FROM sportsbook WHERE "SportsbookID" = $1'
        const result = await connection.query(query, [SportsbookID])
        if (result.rowCount === 0) {
            return error422('Sports book is Not Found', res)
        }
        const sport = result.rows[0]
        const data = {
            status: 200,
            message: 'Sports book retrieved successfully',
            data: sport
        }
        return res.status(200).json(data)
    } catch (error) {
        error500(error, res)
    } finally {
        if (connection) connection.release()
    }
}

//sports book status change
const onStatusChange = async (req, res) => {
  const sportsbookID = parseInt(req.params.id)
  const status = parseInt(req.query.status) // Validate and parse the status parameter
  let connection
  connection = await pool.connect()
  try {
      // Check if the sport exists
      const sportbookQuery = `SELECT * FROM sportsbook WHERE "SportsbookID" = ${sportsbookID}`
      const sportbookResult = await connection.query(sportbookQuery)
      
      if (sportbookResult.rowCount === 0) {
          return res.status(404).json({
              status: 404,
              message: 'Sport not found.'
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
        
        // Soft update the Sports book status
        const updateQuery = `
        UPDATE sportsbook
        SET status = $1
        WHERE "SportsbookID" = $2
        `
        
        await connection.query(updateQuery, [status, sportsbookID])
        
        const statusMessage = status === 1 ? 'activated' : 'deactivated'
        
        return res.status(200).json({
            status: 200,
            message: `Sport ${statusMessage} successfully.`
        })
  } catch (error) {
    return error500(error, res)
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

module.exports = {
  getSportsbooks,
  getSportsbook,
  onStatusChange,
}
