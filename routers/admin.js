let express=require('express');
let router=express.Router();
let User=require('../models/user');
let Category = require('../models/category');
let Content = require('../models/content')

//判断是否是管理员
router.use(function (req,res,next) {
    // console.log(req.userinfo);
    if(!req.userInfo.isAdmin){
        res.send('对不起，只有管理员才能进入后台管理');
        return;
    }
    next();
});

//首页
router.get('/',function(req,res,next){
    res.render('admin/index',{
        userInfo:req.userInfo
    });
});
//用户管理
router.get('/user',function (req,res,next) {
    //从数据库中找到所有的用户信息，并赋给前端使用
    /*
       分页功能实现
       limit(Number):限制从数据库中取出多少条
       skip(Number):从头开始算，跳过几条
       count():统计数据库里有多少条信息
       每页显示两条：
       1 显示1-2，skip(0) :(1-1)*2
       2 显示2-3，skip(2)  (2-1)*2
     */
    let page = Number(req.query.page || 1); //获取用户请求的页面
    let limit=2;
    let skip=(page-1)*limit;
    let pages=0;

    (User.count().then(function (count) {
        // console.log(count)
        //向上取整，计算存在的页数
        pages = Math.ceil(count/limit);
        //用户传过来的页数不能多于存在的页数
        page = Math.min(page,pages);
        page = Math.max(page,1);

        User.find().limit(2).skip(skip).then(function (users) {
            console.log(users);
            res.render('admin/user_index',{
                userInfo:req.userInfo,
                users:users,
                limit:limit,
                page:page,
                pages:pages
            });
        });
    }));


});

//分类首页
router.get('/category',function (req,res,next) {
    let page = Number(req.query.page || 1);
    let limit = 2;
    let pages = 0;

    Category.count().then(function (count) {
        // console.log(count)
        //向上取整，计算存在的页数
        pages = Math.ceil(count/limit);
        //用户传过来的页数不能多于存在的页数
        page = Math.min(page,pages);
        page = Math.max(page,1);
        /*
         id是有时间戳生成的，越先生成的，时间戳越大
         -1：按降序排列
         1：按升序排列
         */
        Category.find().sort({_id:-1}).limit(limit).skip((page-1)*limit).then(function (categories) {
            // console.log(users);
            res.render('admin/category_index',{
                userInfo:req.userInfo,
                categories:categories,
                limit:limit,
                page:page,
                pages:pages
            });
        });
    });
});

//添加分类
router.get('/category/add',function (req,res,next) {
    res.render('admin/category_add',{
        userInfo:req.userInfo
    })
});
//处理分类表单提交的数据
router.post('/category/add',function (req,res,next) {
    // console.log(req.body);
    let name = req.body.name;
    if (name == ''){
        res.render('admin/error',{
            userInfo:req.userInfo,
            message:'分类名称不能为空'
        });
        //这里必须return，如果不退出该函数的话，会在render后再render，报错
        // return;
    }
    //判断数据库中是否包含相同的分类
    else{
        Category.findOne({
            name:name
        }).then(function (info) {
            if(info){
                res.render('admin/error',{
                    userInfo:req.userInfo,
                    message:'该分类已经存在'
                });
                //这里一定要使用return，把reject返回出去，这样下一个then才不会执行
                return Promise.reject();
            }
            else{
                new Category({name:name}).save()
            }
        }).then(function () {
            res.render('admin/success',{
                userInfo:req.userInfo,
                message:'分类添加成功',
                url:'/admin/category'
            })
        })
    }
});

//修改分类
router.get('/category/edit',function (req,res,next) {
    // var name = req.query.name;
    let id=req.query.id||'';
    Category.findOne({
       _id:id
    }).then(function (category) {
        if(!category){
            res.render('admin/error',{
                userInfo:req.userInfo,
                message:'分类信息不存在'
            });
            return Promise.reject();//这里一定要使用return，把reject返回出去，这样下一个then才不会执行
        }else{
            res.render('admin/category_edit',{
                userInfo:req.userInfo,
                category:category
            });
        }
    });

});

//处理修改分类的数据
router.post('/category/edit',function (req,res) {
    let id=req.query.id||''; //
    let name = req.body.name;
    //let name = req.query.name;

    Category.findOne({
        _id:id
    }).then(function (category) {
        if(!category){
            res.render('admin/error',{
                userInfo:req.userInfo,
                message:'分类信息不存在'
            });
            //return Promis.reject();//这里一定要使用return，把reject返回出去，这样下一个then才不会执行
        }else{
            if(name==category.name){
                res.render('admin/error',{
                    userInfo:req.userInfo,
                    message:'修改成功',
                    url:'/admin/category'
                });
                return Promis.reject();//这里一定要使用return，把reject返回出去，这样下一个then才不会执行
            }else{
               //要修改的分类名称是否已经在数据中华存在
                return Category.findOne({
                   _id:{$ne:id},
                   name:name 
                });
            }
        }
    }).then(function (sameCategory) {
        if(sameCategory){
            res.render('admin/error',{
                userInfo:req.userInfo,
                message:'数据库已经存在同名分类',
            });
            return Promise.reject();
        }else{
           return Category.update({
               _id:id
            },{
               name:name
            })
        }
    }).then(function () {
        res.render('admin/success',{
            userInfo:req.userInfo,
            message:'修改成功',
            url:'/admin/category'
        })
    });
    // let newname = req.body.name;
    // Category.update({
    //     name:name
    // },{
    //     $set:{name:newname}
    // }).then(function (info) {
    //     if(info.ok){
    //         res.render('admin/success',{
    //             userInfo:req.userInfo,
    //             message:'修改成功',
    //             url:'/admin/category'
    //         })
    //     }
    //     else{
    //         res.render('admin/error',{
    //             userInfo:req.userInfo,
    //             message:'修改失败'
    //
    //         })
    //     }
    // })
});

//删除分类
router.get('/category/delete',function (req,res,next) {
    let name = req.query.name;
    let id = req.query.id||'';
    // res.send(name);
    Category.remove({
        _id:id
    }).then(function (info) {
        //删除成功后重新渲染页面
        if(info.ok){
            let page = Number(req.query.page || 1);
            let limit = 2;
            let pages = 0;

            Category.count().then(function (count) {
                // console.log(count)
                //向上取整，计算存在的页数
                pages = Math.ceil(count/limit);
                //用户传过来的页数不能多于存在的页数
                page = Math.min(page,pages);
                page = Math.max(page,1);

                Category.find().limit(limit).skip((page-1)*limit).then(function (categories) {
                    // console.log(users);
                    res.render('admin/category_index',{
                        userinfo:req.userinfo,
                        categories:categories,
                        limit:limit,
                        page:page,
                        pages:pages
                    });
                });
            });
        }
    })
});



//内容管理首页
router.get('/content',function (req,res) {
    let page = Number(req.query.page || 1);
    let limit = 2;
    let pages = 0;

    Content.count().then(function (count) {
        // console.log(count)
        //向上取整，计算存在的页数
        pages = Math.ceil(count/limit);
        //用户传过来的页数不能多于存在的页数
        page = Math.min(page,pages);
        page = Math.max(page,1);

        //populate是找到该关联的字段，然后在相关联的表中(在相对应的表结构中定义)
        Content.find().sort({_id:-1}).populate(['category','user']).limit(limit).skip((page-1)*limit).then(function (contents) {
            //console.log(contents);
            Category.find().sort({_id:-1}).then(function (categories) {
                res.render('admin/content_index',{
                    categories:categories,
                    userInfo:req.userInfo,
                    contents:contents,
                    limit:limit,
                    page:page,
                    pages:pages
                });
            });

        });
    });
});

//添加内容
router.get('/content/add',function (req,res) {
    //从数据库中读取分类信息，在option里循环
    Category.find().sort({_id:-1}).then(function (categories) {
        res.render('admin/content_add',{
            userInfo:req.userInfo,
            categories:categories
        })
    });

});

//保存
router.post('/content/add',function (req,res) {
     console.log(req.body);
    if(req.body.title == ''){
        res.render('admin/error',{
            userInfo:req.userInfo,
            message:"标题不能为空"
        })
    }
    else if (req.body.content == ''){
        res.render('admin/error',{
            userInfo:req.userInfo,
            message:'内容不能为空'
        })
    }
    else{
        //保存在数据库中
        return new Content({
            category:req.body.category,
            title:req.body.title,
            user:req.userInfo.id.toString(),
            description:req.body.description,
            content:req.body.content
        }).save().then(function (info) {
            if(info){
                res.render('admin/success',{
                    userInfo:req.userInfo,
                    message:'内容保存成功',
                    url:'/admin/content'
                })
            }
        })
    }
});

//删除内容
router.get('/content/delete',function (req,res) {
    let id = req.query.id;
    Content.remove({_id:id}).then(function (info) {
        let page = Number(req.query.page || 1);
        let limit = 2;
        let pages = 0;
        Content.count().then(function (count) {
            // console.log(count)
            //向上取整，计算存在的页数
            pages = Math.ceil(count/limit);
            //用户传过来的页数不能多于存在的页数
            page = Math.min(page,pages);
            page = Math.max(page,1);

            //populate是找到该关联的字段，然后在相关联的表中(在相对应的表结构中定义)
            Content.find().sort({_id:-1}).populate('category').limit(limit).skip((page-1)*limit).then(function (contents) {
                // console.log(contents);
                res.render('admin/content_index',{
                    userInfo:req.userInfo,
                    contents:contents,
                    limit:limit,
                    page:page,
                    pages:pages
                });
            });
        });
    })
});

//修改内容
router.get('/content/edit',function (req,res) {
    let id=req.query.id||'';
    Content.findOne({
        _id:id
    }).then(function (contents) {
        if(!contents){
            res.render('admin/error',{
                userInfo:req.userInfo,
                message:'内容不存在'
            });
            return Promise.reject();//这里一定要使用return，把reject返回出去，这样下一个then才不会执行
        }else{
            Category.find().sort({_id:-1}).then(function (categories) {
                res.render('admin/content_edit',{
                    userInfo:req.userInfo,
                    categories:categories,
                    contents:contents
                })
            });
        }
    });
});

router.post('/content/edit',function (req,res) {
    let id = req.query.id;
    Content.update({_id:id},{
        $set:{
            category:req.body.category,
            title:req.body.title,
            description:req.body.description,
            content:req.body.content
        }
    }).then(function(info){
        if(info.ok){
            res.render('admin/success',{
                userInfo:req.userInfo,
                message:'修改成功',
                url:'/admin/content'
            })
        }
    })
});
//把值传回去

module.exports=router;