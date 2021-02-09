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

function addOptions(){
    inquirer.prompt([
        {
            type:'list',
            message:'What do you like to add?',
            name:'addAction',
            choices:['Department','Role','Employee','Cancel']
        }
    ]).then(response=>{
        if(response.addAction ===  'Department'){
            addDepartment();
        }else if(response.addAction ===  'Role'){
            addRole();
        }else if(response.addAction ===  'Employee'){
            addEmployee();
        }else{
            welcome();
        };
    })
}

function addDepartment(){
    inquirer.prompt(
    [
        {
            type:'input',
            message:`What is the new Department name`,
            name: 'department'
        }
    ]).then(response =>{
        const newDepartment = {
            name:response.department
        }
        insertInTable('department', newDepartment);
    });     
}
function addRole(){
    connection.query('SELECT * FROM department', (err,res)=>{
        if (err) throw err;
        inquirer.prompt(
            [
                {
                    type:'input',
                    message:`What is the new title?`,
                    name: 'title'
                },
                {
                    type:'number',
                    message:`What is the salary?`,
                    name: 'salary'
                },
                {
                    type:'list',
                    message:'please enter a department id',
                    name:'department',
                    choices:  ()=>{
                        const departments = res.map(department => department.name);
                        return departments;
                    }
                }
            ]).then(response =>{
                const chosenDepartment = res.find(depratment => depratment.name === response.department);
                
                
                const newRole = {
                    title:response.title,
                    salary: response.salary,
                    department_id: chosenDepartment.id
                 }
                 insertInTable('role', newRole);
            }); 
    })
    
}

function insertInTable(table,obj){
    connection.query(`INSERT INTO ${table} SET ?`, obj,
        (err,res)=>{
            if(err) throw err;
            console.log('Succesfully added');
            welcome();
        })
}

function viewDepartments(){
    connection.query('SELECT * FROM department',(err,res)=>{
        if(err) throw err;
        const departments = res.map(department =>department.name);
        return departments;
    })
}

