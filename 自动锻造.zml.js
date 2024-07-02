//  富哥洗武器专用
//  .by好汉饶命!
//  2024年3月19日03:30:18
//  使用方法:将代码添加至自命令中，选择JS原生，保存

//定义全局变量
var inputwqName = null
var wqName = null
var wqID
var stone
var wqData_1 = []
var wqData_1Txt
var wqData_2
var wqData_2Txt
var msgInto = $(".WG_log > pre");
var continue_set = 1
//添加一个钩子，用于捕获武器id，元晶数量，当前武器数据数组，当前武器数据文本
WG.add_hook("dialog", data => {
    if (data.dialog === "pack") {
        if (data.items != null) {
            wqID = (data.items.find(item => item.name.includes(wqName))).id
            let stone_ = data.items.find(item => item.name.includes("元晶"))
            stone = (stone_) ? stone_.count : 0
        } else if (data.from != null) {
            wqData_2 = data.desc.replace(/\n/g, '|').replace(/<ord>|<\/ord>/g, '').replace(/<hio>|<\/hio>/g, '').split('|').slice(4, 8);
            wqData_2Txt = wqData_2.join('|')
        }
    }
});
//定义等待数据返回的函数(延迟用于等待服务器返回数据)
async function wait(cmd, data){
    send(cmd,data)
    await new Promise(resolve => setTimeout(resolve, 500));
}
//定义请求数据的函数
function send(cmd, ...arg) {
    const cmdArr = {
        "stop_": "stopstate",
        "goto": `$to 扬州城-打铁铺`,
        "pack": "pack",
        "getdata": (wqID) => `checkobj ${wqID} from item`,
        "input": (wqID) => `reduanzao ${wqID}`,
        "say": (sayText) => `say ${sayText}`,
        "end": "reduanzao ok"
    };
    const cmds = typeof cmdArr[cmd] === 'function'
        ? cmdArr[cmd](...arg)
        : cmdArr[cmd];
    if (cmds) {
        return WG.SendCmd(cmds);
    }
}

//定义比对武器数组的函数，arrA为设置选择的属性数组数据，arrB为捕获的当前武器数组数据
//返回一个数组，其中sayText字符串用于操作锻造过程、返回sayTextL为操作所需的元晶数量,或者返回一个null
function find_dif(arrA,arrB){
    let tmp1 = [...arrA];
    let tmp2 = [];
    for ( var i = 0 ; i < arrB.length ; i++ ){
        if (arrA.indexOf(arrB[i]) >= 0){
            tmp1 = tmp1.filter(item => item !== arrB[i])
        } else {
            tmp2.push(i + 1)
        }
    }
    if (tmp1.length > 0){
        let sayText = tmp2.join(" ");
        let sayTextL = 10 - ( tmp2.length * 2 )
        return [sayText,sayTextL]
    } else {
        return null
    }
}

//定义获取设置武器数据的函数
//通过全局变量的办法获取设置的武器数据(用于比对)，文本字符串(用于展示)
function wqDataOfselect(){
    $(".select-group").each(function () {
        const select1 = $(this).find("select:first");
        const select2 = $(this).find("select:last");
        const value1 = select1.val();
        const value2 = select2.val();
        if (value1 !== "不选择" && value2 !== "不选择") {
            let tmp_Select;
            if (value1 === "绝招冷却时间") {
                tmp_Select = value1 + "：-" + value2;
            } else {
                tmp_Select = value1 + "：+" + value2;
            }
        wqData_1.push(tmp_Select);
        wqData_1Txt = wqData_1.join('|')
        }
    })
}
//定义锻造一次过程的函数，更新当前武器属性的渲染。
//通过判定锻造词条数量、元晶数量，来决定是否退出锻造过程
async function reForge(){
    await wait("pack");
    await wait("getdata",wqID);
    await new Promise(resolve => setTimeout(resolve, 500));
    $(".weaponData-2").html("<span><hic>属性2</hic>:<hig> " + wqData_2Txt + "</hig></span>")
    const tmp_say = find_dif(wqData_1,wqData_2)
    if ( !tmp_say || !tmp_say[0] || tmp_say[1] > stone ) {
        $(".content-message > pre").append("<ord>注意：</ord><hic>已停止锻造</hic>\n")
        continue_set = 0
        return
    }
    await wait("input",wqID);
    await wait("say",tmp_say[0]);
    await wait("end");
}    
//定义生成<select>框的函数
function createSelect(options) {
    const select = $("<select></select>");
    options.forEach(option => {
    select.append($("<option></option>").val(option).text(option));
    });
    return select;
}
//定义<武器数据>渲染的函数
function wqDataRender(wqData,div_num){
    const divRender = $("<div class='weaponData-" + div_num + "'></div>");
    const spanRender = $("<span><hic>属性" + div_num + "</hic>:<hig> " + wqData + "</hig></span>");
    divRender.append(spanRender),
    msgInto.before(divRender);
}
//定义初始界面渲染的函数，创建四组选项、一个武器名字、一个提交按钮
function statsRender(){
    //移除之前所有msgInto的信息
    $(".WG_log .select-group, .WG_log button, .WG_log input, .WG_log .item-commands, .WG_log .weaponData-1, .WG_log .weaponData-2").remove();
    WG.SendCmd("$cls")
    //定义两个选择下拉框的数组
    const options_1 = ["不选择", "绝招冷却时间", "负面状态抵抗", "攻击速度", "忽视对方防御", "最终伤害", "暴击", "暴击伤害", "气血", "命中", "招架", "躲闪", "忙乱时间", "忽视忙乱"];
    const options_2 = ["不选择", "18%", "20%", "21%", "23%", "25%", "26%"];
    for (var i = 0; i < 4; i++) {
        const selectGroup = $("<div class='select-group'></div>");
        const selecttitle = $("<hic>第" + (i + 1) + "个属性</hic>");
        selectGroup.append(selecttitle);
        const select1 = createSelect(options_1);
        const select2 = createSelect(options_2);
        selectGroup.append(select1, select2);
        msgInto.before(selectGroup);
    }
    inputwqName = $("<input type='text' placeholder='输入自制武器中文名' class='text-input' id='inputWeaponName'>");
    const Button = $("<button type='button' class='collect'>提交</button>");
    msgInto.before(inputwqName,Button);
}

//提交按钮绑定，渲染选择的武器词条、当前的武器词条、四个操作按钮
$(".WG_log").on("click",".collect", async function() {
    wqDataOfselect()
    wqName = inputwqName.val();
    await wait("pack");
    await wait("getdata",wqID)
    await new Promise(resolve => setTimeout(resolve, 500));
    wqDataRender(wqData_1Txt,1)
    wqDataRender(wqData_2Txt,2)
    $(".WG_log .select-group, .WG_log button, .WG_log input").remove();
    msgInto.before("<div class='item-commands'><span class='readyfor'>准备</span><span class='fuckyself'>手动</span><span class='automatic'>自动</span><span class='cessation'>停止</span></div>")
})
//准备按钮绑定
$(".WG_log").on("click",".readyfor", async function() {
    await wait("stop_");
    await wait("goto");
    await wait("pack");
    const tmp_say = find_dif(wqData_1,wqData_2)
    if (!tmp_say || !tmp_say[0] || tmp_say[1] > stone) {
        $(".content-message > pre").append("<ord>注意：</ord><hic>条件不足无法锻造</hic>\n")
        return
    }
    $(".content-message > pre").append("<ord>注意：</ord><hic>可以开始锻造</hic>\n")
})
//绑定手动按钮
$(".WG_log").on("click",".fuckyself", async function() {
    await reForge();
})
//绑定自动按钮
$(".WG_log").on("click",".automatic", async function() {
    continue_set = 1
    while (continue_set === 1) {
        await reForge();
    }
    $(".content-message > pre").append("<ord>注意：</ord><hic>自动锻造已停止</hic>\n")
})
//绑定停止按钮
$(".WG_log").on("click",".cessation", function() {
    $(".content-message > pre").append("<ord>注意：</ord><hic>请等待停止</hic>\n")
    $(".WG_log .select-group, .WG_log button, .WG_log input, .WG_log .item-commands, .WG_log .weaponData-1, .WG_log .weaponData-2").remove();
    continue_set = 0
})
alert("1、点击<提交>按钮后等待数据生成\n2、点击<准备锻造>按钮完成准备工作\n3、选择锻造方式或者停止自动锻造\n4、请确保自制武器在包里")
statsRender()
