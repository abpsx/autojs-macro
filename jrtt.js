/**
 * 简单今日头条极速版开宝箱脚本
 */

// #sleep()会阻塞 尽量用settime代替 必须用时要考虑等待时间差
// 勿删 检查是否开启手机必要功能
auto();
auto.waitFor()

// 全局变量
let targetTab // 底部导航的目标tab

//  任务逻辑

var task_openGoldenBox = {
    /** 任务名 */
    taskName: "宝箱",
    /** 基本等待时间 任务周期 */
    taskInterval: 10 * 60 * 1000,
    /** 防封 调整合适的噪点作为随机区间 */
    timeNoise: function () {
        return random(10 * 1000, 60 * 1000)
    },
    run: function () {
        toastLog("当前任务: " + this.taskName)
        targetTab = "任务"
        checkCurrentTab(true)

        // 10s检测
        let count = 0
        while (!checkLoaded() && count++ < 10) {
            sleep(1000)
        }

        let nextTime = this.taskInterval + this.timeNoise()
        toastLog("下次任务时间: " + nextTime)
        count <= 10 ? this.successCB(nextTime) : this.failedCB(nextTime)
    },
    successCB: function (time) {
        findTarget("宝箱").findOne().parent().click()
        extendTask_nextBox.run()

        setTimeout(() => {
            openAPP()
            task_openGoldenBox.run()
        }, time);
    },
    failedCB: function (time) {
        // TODO 如果箱子还在倒计时其实可以调出倒计时时间作为等待时间 当前逻辑哪怕只剩一分钟也会等十分钟 需要的自己调整
        // 调整记得最终时间要加timeNoise函数 防封
        setTimeout(() => {
            openAPP()
            task_openGoldenBox.run()
        }, time);
    }
}

var extendTask_nextBox = {
    taskName: "宝箱后续",
    taskInterval: 0,
    timeNoise: function () {
        return random(1 * 1000, 5 * 1000)
    },
    run: function () {
        toastLog("当前任务: " + this.taskName)
        targetTab = "宝箱追加广告"

        let count = 0
        while (!checkLoaded() && count++ < 10) {
            sleep(1000)
        }

        sleep(this.timeNoise())
        count <= 10 ? this.successCB() : this.failedCB()
    },
    successCB: function () {
        findTarget("宝箱追加广告").findOne().parent().click()
        setTimeout(() => {
            extendTask_ad.run()
        }, 5000);
    },
    failedCB: function () {
    }
}

var extendTask_ad = {
    taskName: "广告处理",
    taskInterval: 0,
    run: function () {
        toastLog("当前任务: " + this.taskName)
        targetTab = "广告"
        checkLoaded() && this.successCB()
    },
    successCB: function () {
        handleAD()
    },
    failedCB: function () {
    }
}

// 入口

function run() {
    openAPP()
    task_openGoldenBox.run()
}
run()

// 函数

function openAPP() {
    launchApp("今日头条极速版");
}

/**
 * 
 * @param {Boolean} bJump 是否跳转 false时仅返回boolean 不做跳转操作
 */
function checkCurrentTab(bJump) {
    let result = id("ko").className("android.widget.TextView").selected(true).findOne().text()
    result = (targetTab == "任务") ? /(\d\d\:\d\d)|(开宝箱)|(任务)/.test(result) : result == targetTab
    bJump && !result && jumpTab(targetTab)
    return result
}

/**
 * 跳转到指定Tab
 */
function jumpTab() {
    id("ko").className("android.widget.TextView").find().forEach(function (tv, index) {
        if (tv.text() == targetTab || (targetTab == '任务' && index == 2)) {
            tv.parent().click()
        }
    })
}

/**
 * 监测当前Tab页面是否加载完成 
 * 以页面特有控件加载情况为标准
 */
function checkLoaded() {
    let result
    switch (targetTab) {
        case "首页":
            result = findTarget("首页").find().length == 1
            break;
        case "任务":
            result = findTarget("任务").find().length == 1
            break;
        case "宝箱追加广告":
            result = findTarget("宝箱追加广告").find().length == 1
            break;
        case "广告":
            result = isADViewport()
            break;
        default:
            result = false
            break;
    }
    return result
}

/**
 * 查找指定类型的控件 配合checkLoaded函数使用
 * @param {String} target 目标类型
 */
function findTarget(target) {
    let result
    switch (target) {
        case "首页":
            result = className("android.widget.TextView").text("发布")
            break;
        case "任务":
            result = className("android.widget.Image").text("开宝箱得金币")
            break;
        case "宝箱":
            result = className("android.widget.Image").text("开宝箱得金币")
            break;
        case "宝箱追加广告":
            result = className("android.view.View").text("看完视频再领")
            break;
        default:
            result = false
            break;
    }
    return result
}


// 函数 特殊处理

/** 判断当前页面是否广告页 */
function isADViewport() {
    return id('vangogh_video_view').exists()
}

/** 广告处理 领完奖励关闭 */
function handleAD() {
    let target = className("android.view.View").desc("关闭").findOne().parent().bounds()
    while (target.right - target.left > 130) {
        target = className("android.view.View").desc("关闭").findOne().parent().bounds()
    }
    sleep(random(1000, 3000))
    back()
    while (isADViewport()) {
        back()
        sleep(0.3 * 1000)
    }
}