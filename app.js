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
                            const workers = emp_res.map(worker => worker.first_name);
                            return workers;
                        }
                    }
                ]).then(response =>{
                    const chosenRole = res.find(role => role.title === response.role);
                    const chosenEmployee = emp_res.find(employee => employee.first_name === response.manager)
                    
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
        viewData(res,'departments');
        
    });
    
}

function viewRoles(){
    connection.query(`SELECT role.title, role.salary, department.name FROM role
    INNER JOIN department ON department.id = role.department_id;`,(err,res)=>{
        if(err) throw err;
        if(validateData(res,'Roles')){
            return welcome();
        };
        viewData(res,'roles');
        
    });
    
}

function viewEmployees(){
    connection.query('SELECT * FROM employee',(err,res)=>{
        if(err) throw err;
        
        if(validateData(res,'employees')){
            return welcome();
        };
        viewData(res,'employees');
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

function viewData(data,str){
    const newData = data.map(employee =>employee);
        console.log(`*** ${str.toUpperCase()} ***\n-------------------`);
        if(str === 'employees'){
            newData.forEach(employee => console.log(`${employee.first_name} ${employee.last_name} | ${employee.role_id} | ${employee.manager_id}`));
        } else if (str === 'roles'){
            newData.forEach(role => console.log(`${role.title} | ${role.salary} | ${role.name}`));
        }else{
            newData.forEach(dept => console.log(`${dept.id} | ${dept.name}`));
        }
        console.log(`-------------------`);
       welcome();
}



