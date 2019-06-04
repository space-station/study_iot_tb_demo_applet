'use strict';
const co = require('co')

function main(){
    var task_ctx = {success:true, text:""};
    var type = "co";
    switch(type){
        case "gen":
            test_gen(task_ctx);
            break;
        case "prom":
            test_prom(task_ctx);
            break;
        case "prom2":
            test_prom2(task_ctx);
            break;
        case "co":
            test_co(task_ctx);
            break;
        default:
            console.log("must be gen | prom | co");
    }
}

//for generator
function test_gen(task_ctx){
    task_ctx.type = "generator";
    var genObj;
    var func_success = function(t_ctx){
        genObj.next(t_ctx);
    };
    var func_fail = function(t_ctx){
        genObj.throw(t_ctx);
    };
    genObj = generator(task_ctx, func_success, func_fail);
    genObj.next();
}

function* generator(task_ctx, func_success, func_fail){
    try{
        yield task_step_1(task_ctx, func_success, func_fail);
        yield task_step_2(task_ctx, func_success, func_fail);
        console.log(task_ctx.text);
        console.log(task_ctx);
    }catch(err){
        console.log("exception caught inside generator function");
        console.log(err);
    }
}

// for promise
function test_prom(task_ctx){
    task_ctx.type = "promise";
    var promise = new Promise(function(resolve, reject){
        task_step_1(task_ctx, resolve, reject);
    })
    .then(function(t_ctx){
        return new Promise(function(resolve, reject){
            task_step_2(task_ctx, resolve, reject);
        });
    })
    .then(function(t_ctx){
        console.log(t_ctx.text);
        console.log(t_ctx);
    })
    .catch(function(t_ctx){
        console.log("caught by promise.catch()");
        console.log(t_ctx);
    });
}

// for promise2
function test_prom2(task_ctx){
    task_ctx.type = "promise2";
    var promise = task_promise_1(task_ctx)
    .then(task_promise_2)
    .then(function(t_ctx){
        console.log(t_ctx.text);
        console.log(t_ctx);
    })
    .catch(function(t_ctx){
        console.log("caught by promise.catch()");
        console.log(t_ctx);
    });
}

// for co
function test_co(task_ctx){
    co(co_process_wrap(task_ctx))
    .catch(function(t_ctx){
        console.log("caught by co.catch()");
        console.log(t_ctx);
    });
}

function co_process_wrap(task_ctx){
    return function* co_process(){
        task_ctx.type = "co";
        var r1 = yield task_promise_1(task_ctx);
        var r2 = yield task_promise_2(task_ctx);
        
        console.log(task_ctx.text);
        console.log(task_ctx);
    }
}

// basic promise functions
function task_promise_1(t_ctx){
    return new Promise(function(resolve, reject){
        task_step_1(t_ctx, resolve, reject);
    });
}

function task_promise_2(t_ctx){
    return new Promise(function(resolve, reject){
        task_step_2(t_ctx, resolve, reject);
    });
}

// basic step functions
function task_step_1(t_ctx, func_success, func_fail){
    setTimeout( ()=>{
        //succ | fail
        t_ctx.text += "\ntask_step_1 " + t_ctx.type + ", done.";
        t_ctx.success = true;
        func_success(t_ctx);

    }, 1000 );
}

function task_step_2(t_ctx, func_success, func_fail){
    setTimeout( ()=>{
        //succ | fail
        t_ctx.text += "\ntask_step_2 " + t_ctx.type + ", done.";
        var succ = true;
        if(succ){
            t_ctx.success = true;
            func_success(t_ctx);
        }else{
            t_ctx.success = false;
            func_fail(t_ctx);
        }

    }, 1000 );
}

main();
