const bcrypt = require("bcrypt")
const db = require("../config/db")

//register a user
//taking in name, password(will need to be hashed), email



//check if a user is already registered
const checkEmail = async(userData)=>{
    const checkEmailQuery = `SELECT * FROM Users WHERE email = ?`

    const [result] = await db.query(checkEmailQuery, [userData.email])
    return result
}

//follows async await approach
const createUser = async(userData) =>{
    const createQuery = `INSERT INTO Users(name, email, password) VALUES (?, ?, ?)`
    const values = [userData.name, userData.email, userData.hashed_password]
    //used a promise as db.query runs asynchronously
    //callback is not used as we have imported mysql/prmoise 
    const [result] = await db.query(createQuery, values)
        return result //will only execute when promise is resolved 
}

const registerUser = async(req, res) =>{
    const userData = {
        email: req.body.email,
        password: req.body.password,
        name: req.body.name
    }
      if (!userData.email || !userData.password || !userData.name) {
        return res.status(400).json({
          success: false,
          message: "Please fill all the required fields",
        });
    };
    //call checkEmail to check is user is already registered
    try{
      const checkEmailResult = await checkEmail(userData);
      if (checkEmailResult.length > 0) {
        //user already exists
        return res.status(409).json({
          success: false,
          message: "User is already registered",
        });
      }
      //user does not exist
      //hash the password
      userData.hashed_password = await bcrypt.hash(userData.password, 10); //bcrypt.hash is asynchrnous
      //try and catch used with async await to execute createUser

      /*If promise is resolved in createUser then the try block executes and success message is sent if the promise
    is rejected createUser will not fully execute and the error message from catch block will be executed */
      try {
        const resultRegister = await createUser(userData);
        return res.status(201).json({
          success: true,
          message: "User registered successfully"
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Error is registering user",
          error: error.message,
        });
      }
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: "Error is registering user",
            error: error.message
        })
    }
}

module.exports = {registerUser}