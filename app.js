const mysql = require('mysql');
const inquirer = require('inquirer');
const cTable = require('console.table');

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
            name:'action',
            choices:['Add Department','Add Role', 'Add Employee',
            'View Departments','View Roles', 'View Employees',
            'Update Employee role','Exit']
        }
    ]).then(response =>{
        switch(response.action){
            case 'Add Department':
                addDepartment();
                break;
            
            case 'Add Role':
                addRole();
                break;

            case 'Add Employee':
                addEmployee();
                break;
            
            case 'View Departments':
                viewDepartments();
                break;
            case 'View Roles':
                viewRoles();
                break;
            case 'View Employees':
                viewEmployees();
                break;
            
            case 'Update Employee role':
                updateRole();
                break;

            default:
                connection.end();
                break;
        }
    });
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

function addEmployee(){
    connection.query(`SELECT * FROM role`, (err,res)=>{
        if (err) throw err;
        connection.query(`SELECT * FROM employee`, (err, emp_res)=>{
            if(err)throw err;
            inquirer.prompt(
                [
                    {
                        type:'input',
                        message:`Employees first name?`,
                        name: 'fName'
                    },
                    {
                        type:'input',
                        message:`Employees last name?`,
                        name: 'lName'
                    },
                    {
                        type:'list',
                        message:'please choose a role',
                        name:'role',
                        choices:  ()=>{
                            const roles = res.map(role => role.title);
                            return roles;   
                        }
                    },
                    {
                        type:'list',
                        message:'assign a manager',
                        name:'manager',
                        when: (answers) => answers.role !== 'Manager',
                        choices:  ()=>{
                            const employees = emp_res.map(emp =>`${emp.first_name} ${emp.last_name}`);
                            return employees;
                        }
                    }
                ]).then(response =>{
                    const chosenRole = res.find(role => role.title === response.role);
                    const chosenEmployee = emp_res.find(emp => `${emp.first_name} ${emp.last_name}` === response.manager)
                    
                    const newEmployee = {
                        first_name:response.fName,
                        last_name: response.lName,
                        role_id: chosenRole.id,
                     }
                     if(response.role === "Manager"){
                         newEmployee.manager_id = null;
                     }else{
                         newEmployee.manager_id = chosenEmployee.id;
                     }
                     insertInTable('employee', newEmployee);
                }); 
        })

        
    })
}

function insertInTable(table,obj){
    connection.query(`INSERT INTO ${table} SET ?`, obj,(err,res)=>{
            if(err) throw err;
            console.log('Succesfully added');
            welcome();
    });
}


function viewDepartments(){
    connection.query('SELECT * FROM department',(err,res)=>{
        if(err) throw err;
        if(validateData(res,'Departments')){
            return welcome();
        };
        console.table(res);
        welcome();
        
    });
    
}

function viewRoles(){
    connection.query(`SELECT role.title, role.salary, department.name FROM role
    INNER JOIN department ON department.id = role.department_id;`,(err,res)=>{
        if(err) throw err;
        if(validateData(res,'Roles')){
            return welcome();
        };
        console.table(res);
        welcome();
        
    });
    
}

function viewEmployees(){
    connection.query('SELECT * FROM employee',(err,res)=>{
        if(err) throw err;
        
        if(validateData(res,'employees')){
            return welcome();
        };
        console.table(res);
        welcome();
    });
    
}

function updateRole(){
    console.log('role updated');
    welcome();
}

function validateData(array, string){
    if(array.length === 0){
        console.log(`-------\n*****No ${string} found*******\n------------`);
        return true;
    }
    return false;
}

function updateRole(){
    connection.query('SELECT * FROM employee',(err,emp_res)=>{
        if (err) throw err;
        connection.query('SELECT * FROM role', (err,role_res)=>{
            if(err) throw err;
            inquirer.prompt([
                {
                    type:'list',
                    message:'please choose an employee to update',
                    name:'employee',
                    choices:()=>{
                        const employees = emp_res.map(emp => `${emp.first_name} ${emp.last_name}`);
                        return employees;
                    }
                },
                {
                    type:'list',
                    message:'please choose a new role',
                    name:'role',
                    choices:()=>{
                        const roles = role_res.map(role => role.title);
                        return roles;
                    }
                }
            ]).then(response=>{
                
                const chosenEmp = emp_res.find(emp => `${emp.first_name} ${emp.last_name}` === response.employee);
                const chosenRole = role_res.find(role => role.title === response.role);
                
                connection.query(`UPDATE employee SET role_id = ${chosenRole.id} WHERE id = ${chosenEmp.id}`, (err,res)=>{
                    if(err) throw err;
                    welcome();
                })
            })
        })
    })
}