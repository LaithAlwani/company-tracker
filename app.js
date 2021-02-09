const mysql = require('mysql');
const inquirer = require('inquirer');

const connection = mysql.createConnection({
    host:'localhost',
    port:3306,
    user:'root',
    password:'newPass',
    database:'employee_tracker_db'
});


connection.connect(function(err){
    if(err) throw err;
    console.log(`connected as id ${connection.threadId}`);
    welcome();
});

function welcome(){
    inquirer.prompt([
        {
            type:'list',
            message:'what would you like to do?',
            name:'addViewUpdate',
            choices:['Add','View','Update','Exit']
        }
    ]).then(response =>{
        if(response.addViewUpdate === 'Add'){
            addOptions()
        }else if(response.addViewUpdate === 'View'){
            viewDepartments();
        }else if(response.addViewUpdate === 'Update'){
            updateOptions();
        }else{
            connection.end();
        }
    });
}


