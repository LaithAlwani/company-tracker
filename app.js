const mysql = require('mysql');
const inquirer = require('inquirer');
const cTable = require('console.table');

const allEmployeesQuery = `SELECT e.id, e.first_name AS "First Name", e.last_name AS "Last Name", r.title, d.name AS "Department", r.salary AS "Salary", CONCAT(m.first_name," ",m.last_name) AS "Manager"
FROM employee e
LEFT JOIN role r 
ON r.id = e.role_id 
LEFT JOIN department d 
ON d.id = r.department_id
LEFT JOIN employee m ON m.id = e.manager_id`;

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
    start();
});

//starts the application  
function start(){
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
        //switch statment that determine what the user wants to do.
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

//add department
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

//add a new role to a department
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

//add a new employee, assigne the emlpyoo to a role.
function addEmployee(){
    connection.query(`SELECT * FROM department`, (err,res)=>{
        if (err) throw err;
        connection.query(`SELECT e.id, e.first_name, e.last_name, r.title from employee AS e
        LEFT JOIN role AS r
        ON e.role_id = r.id
        WHERE r.title = "Manager"`, (err, emp_res)=>{
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
                        message:'please choose a department to assign the new employee to',
                        name:'department',
                        choices:  ()=>{
                            const departments = res.map(dept => dept.name);
                            return departments;   
                        }
                    }
                ]).then(response=>{
                    //deterime which department was the employee assianged too.
                    const chosenDept = res.find(dept => dept.name === response.department);
                    connection.query(`SELECT * FROM role WHERE role.department_id = ${chosenDept.id}`, (err,result)=>{
                       if(err) throw err;
                        inquirer.prompt([
                            {
                                type:'list',
                                message:'please choose a role',
                                name:'role',
                                choices:  ()=>{
                                    const roles = result.map(role => role.title);
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
                        ]).then(answers =>{
                            // determine which role the employee is given
                            const chosenRole = result.find(role => role.title === answers.role);
                            const chosenEmployee = emp_res.find(emp => `${emp.first_name} ${emp.last_name}` === answers.manager)
                            
                            const newEmployee = {
                                first_name:response.fName,
                                last_name: response.lName,
                                role_id: chosenRole.id,
                             }
                             if(answers.role === "Manager"){
                                 newEmployee.manager_id = null;
                             }else{
                                 newEmployee.manager_id = chosenEmployee.id;
                             }
                             insertInTable('employee', newEmployee);
                        }); 
                    })
                })  
        }) 
    })
}

//Inserts an object into a specifed table in the database
function insertInTable(table,obj){
    connection.query(`INSERT INTO ${table} SET ?`, obj,(err,res)=>{
            if(err) throw err;
            console.log('Succesfully added');
            start();
    });
}

//view all departemnts
function viewDepartments(){
    connection.query('SELECT * FROM department',(err,res)=>{
        if(err) throw err;
        if(validateData(res,'Departments')){
            return start();
        };
        console.table(res);
        start();
        
    });  
}

// view all roles
function viewRoles(){
    connection.query(`SELECT role.title, role.salary, department.name AS "Department" FROM role
    INNER JOIN department ON department.id = role.department_id;`,(err,res)=>{
        if(err) throw err;
        if(validateData(res,'Roles')){
            return start();
        };
        console.table(res);
        start();
        
    });
    
}

//view all employees
function viewEmployees(){
    connection.query(allEmployeesQuery,(err,res)=>{
        if(err) throw err;
        
        if(validateData(res,'employees')){
            return start();
        };
        console.table(res);
        start();
    });
    
}

//validates if the response from the database has any data
function validateData(array, string){
    if(array.length === 0){
        console.log(`-------\n*****No ${string} found*******\n------------`);
        return true;
    }
    return false;
}

//update employee role by chosing an employee an assigning them a new role
function updateRole(){
    connection.query('SELECT * FROM employee',(err,emp_res)=>{
        if (err) throw err;
        connection.query('SELECT * FROM department', (err,dept_res)=>{
            
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
                    message:'please choose a department',
                    name:'department',
                    choices:()=>{
                        const departments = dept_res.map(dept => dept.name);
                        return departments;
                    }
                }
            ]).then(response=>{
                
                const chosenEmp = emp_res.find(emp => `${emp.first_name} ${emp.last_name}` === response.employee);
                const chosenDept = dept_res.find(dept => dept.name === response.department);
                
                connection.query(`SELECT * FROM role WHERE department_id = ${chosenDept.id}`,(err, role_res)=>{
                    if(err) throw err;
                    
                    inquirer.prompt([
                        {
                            type:'list',
                            message:'please choose a new role',
                            name:'role',
                            choices:()=>{
                                const roles = role_res.map(role => role.title);
                                return roles;
                            }
                        }
                    ]).then(answer =>{
                        const chosenRole = role_res.find(role => role.title === answer.role);
                        connection.query(`UPDATE employee SET role_id = ${chosenRole.id} WHERE id = ${chosenEmp.id}`, (err,res)=>{
                            if(err) throw err;
                            start();
                        })
                    });
                }); 
            })
        })
    })
}