const pool = require('../../../db');
//handle error 422...
error422 = (message, res) => {
    return res.status(422).json({
        status: 422,
        message: message
    })
}
//handle error 500...
error500 = (error, res) => {
    console.log(error);
    return res.status(500).json({
        status: 500,
        message: "Internal Server Error",
        error: error
    })
}
//create state 
const createState = async (req, res) => {
    const state_name = req.body.state_name ? req.body.state_name.trim() : '';
    const description = req.body.description ? req.body.description.trim() : '';
    const untitled_id = req.companyData.untitled_id;
    if (!state_name) {
        return error422("State name is required.", res)
    } else if (!untitled_id) {
        return error422("Untitled id is required.", res)
    }
    let connection;
    try {
        connection = await pool.connect();
        const query = "SELECT * FROM states WHERE TRIM(LOWER(state_name)) = $1";
        const result = await connection.query(query, [state_name])
        if (result.rows.length > 0) {
            return error422("State already exists.", res)
        }
        const insertQuery = "INSERT INTO states (state_name, description, untitled_id ) VALUES ($1, $2, $3)";
        const insertResult = await connection.query(insertQuery, [
            state_name,
            description,
            untitled_id
        ])
        return res.status(200).json({
            status: 200,
            message: "State created successfully"
        })
    } catch (error) {
        error500(error, res)
    } finally {
        if (connection) connection.release();
    }

}
//get states list...
const getStates = async (req, res) => {
    const { page, perPage, key } = req.query
    let connection
    try {
        connection = await pool.connect()
        let query = 'SELECT * FROM states'
        let countQuery = 'SELECT COUNT(*) AS total FROM states'
        if (key) {
            const lowercaseKey = key.toLowerCase().trim()
            if (key === 'activated') {
                query += ' WHERE status = 1'
                countQuery += ' WHERE status = 1'
            } else if (key === 'deactivated') {
                query += ' WHERE status = 0'
                countQuery += ' WHERE status = 0'
            } else {
                query += ` WHERE LOWER(state_name) LIKE '%${lowercaseKey}%'`
                countQuery += ` WHERE LOWER(state_name) LIKE '%${lowercaseKey}%'`
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
        const sports = result.rows
        const data = {
            status: 200,
            message: 'State retrieved successfully',
            data: sports
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
//get state by id...
const getState = async (req, res) => {
    const state_id = parseInt(req.params.id)
    if (!state_id) {
        return error422("State id is required.", res)
    }

    let connection
    try {
        connection = await pool.connect()
        let query = 'SELECT * FROM states WHERE state_id = $1'
        const result = await connection.query(query, [sport_id])
        if (result.rowCount === 0) {
            return error422('State is Not Found', res)
        }
        const sport = result.rows[0]
        const data = {
            status: 200,
            message: 'State retrieved successfully',
            data: sport
        }
        return res.status(200).json(data)
    } catch (error) {
        error500(error, res)
    } finally {
        if (connection) connection.release()
    }
}
//update state...
const updateState = async (req, res) => {
    const state_id = parseInt(req.params.id)
    const state_name = req.body.state_name ? req.body.state_name.trim() : ''
    const description = req.body.description ? req.body.description.trim() : ''
    const untitled_id = req.companyData.untitled_id

    if (!state_id) {
        return error422('State Id is required.', res)
    } else if (!state_name) {
        return error422('State name is required.', res)
    } else if (!untitled_id) {
        return error422('Untitled id is required.', res)
    }
    let connection
    connection = await pool.connect()
    // check if state exists
    const checkStateQuery = 'SELECT * FROM states WHERE state_id = $1'
    const checkStateResult = await connection.query(checkStateQuery, [state_id])
    if (checkStateResult.rowCount === 0) {
        return error422('State is Not Found', res)
    }
    //check is State name exist
    const checkStateNameQuery =
        'SELECT * FROM states WHERE TRIM(LOWER(state_name)) = $1 AND state_id != $2'
    const checkStateNameResult = await connection.query(checkStateNameQuery, [
        state_name.toLowerCase(),
        state_id
    ])
    if (checkStateNameResult.rowCount > 0) {
        return error422('State name is already exist.', res)
    }
   
    try {
        //update the state record with new data
        const updateQuery = `
      UPDATE states
      SET state_name = $1, description = $2, untitled_id =$3
      WHERE state_id = $4
      `
        const updateResult = await connection.query(updateQuery, [
            state_name,
            description,
            untitled_id,
            state_id
        ])
        return res.status(200).json({
            status: 200,
            message: "State updated successfully."
        })
    } catch (error) {
        return error500(error, res)
    } finally {
        if (connection)  connection.release()
    }
}
//state status change...
const onStatusChange = async (req, res) => {
    const stateId = parseInt(req.params.id)
    const status = parseInt(req.query.status) // Validate and parse the status parameter
    let connection
    connection = await pool.connect();
    try {
        // Check if the state exists
        const stateQuery =
            'SELECT * FROM states WHERE state_id = $1'
        const stateResult = await connection.query(stateQuery, [
            stateId
        ])

        if (stateResult.rowCount === 0) {
            return res.status(404).json({
                status: 404,
                message: 'State not found.'
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

        // Soft update the state status
        const updateQuery = `
            UPDATE states
            SET status = $1
            WHERE state_id = $2
        `

        await connection.query(updateQuery, [status, stateId])

        const statusMessage = status === 1 ? 'activated' : 'deactivated'

        return res.status(200).json({
            status: 200,
            message: `State ${statusMessage} successfully.`
        })
    } catch (error) {
        return error500(error, res)
    } finally {
        if (connection) connection.release()
    }
}
//get States Wma...
const getStatesWma = async (req, res)=>{
    let connection
    connection = await pool.connect()
    try{
        let query = "SELECT * FROM states WHERE status = 1 ORDER BY cts DESC";
        const result = await connection.query(query);
        const states = result.rows;
        return  res.status(200).json({
            status:200,
            message:"States retrieved successfully.",
            data: states
        });

    } catch (error){
       return error500(error,res)
    } finally {
        if(connection) connection.release()
    }


}
module.exports = {
    createState,
    getStates,
    getState,
    updateState,
    onStatusChange,
    getStatesWma 
}