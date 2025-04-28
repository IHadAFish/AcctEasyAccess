// ==UserScript==
// @name        Acct Easy Access
// @match       REMOVED.html*
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @version     0.3.10
// @author      Alan.Li
// @run-at      document-body
// @grant       GM_xmlhttpRequest
// ==/UserScript==

const AEA_SEV_URL = "REMOVED";

const res_processors = {
    "GetProductExtensionData": pProductExtensionData,
    "GetMasterAccountListV3": pMasterAcctList,
    "GetAHCBasicInfo": pAHCBasicInfo,
    "GetBaseAdminInfo": pBaseAdminInfo,
    "GetAccountTag": pAcctTag
};

// Setup XML monitoring for AJAX responses
(function () {
    'use strict';

    const original_send = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.send = function (data) {
        this.addEventListener('load', function () {
            const response_text = this.responseText;
            const response_url = this.responseURL;

            let res_file = response_url.split("/").pop();
            if (res_processors.hasOwnProperty(res_file)) {
                res_processors[res_file](JSON.parse(response_text));
            }
        });

        return original_send.apply(this, arguments);

    };
})();

/****************************
*
* Processor functions
*
*****************************/

// Cache master acct info
let MASTER_ACCT_INFO = null;
function pMasterAcctList(raw_data) {
    MASTER_ACCT_INFO = raw_data["resultData"];
}

let USER_INFO = null;
function pBaseAdminInfo(raw_data) {
    USER_INFO = raw_data["resultData"];
}

let ACCT_TAG = [];
function pAcctTag(raw_data) {
    ACCT_TAG = raw_data["resultData"]["Message"].split(";");
    ACCT_TAG = ACCT_TAG.map((elm) => elm.toUpperCase());

    showReminders(...reminder_args);
}

let reminder_args = [];
function pProductExtensionData(raw_data) {
    raw_data = raw_data["resultData"];
    // List EA options
    showEasyAccess(raw_data["ProductType"], raw_data["BaseProductInfo"]["ProductAccount"]);

    // List Acct options
    showAcctInfo(raw_data);

    showTickets(raw_data["BaseProductInfo"]["ProductAccount"])

    let product_type = raw_data["ProductType"];
    if (product_type == "BB") {
        let business_accts = []
        MASTER_ACCT_INFO.list.forEach((mas) => {
            business_accts = business_accts.concat(mas.BusinessAccountList.list);
        });

        const cur_acct_id = raw_data["BaseProductInfo"]["ProductAccount"];

        for (var i = 0; i < business_accts.length; i++) {
            if ((business_accts[i]["BusinessAccountId"] == cur_acct_id) && (business_accts[i]["ComboTag"] == "Prime")) {
                product_type = "Prime";
                break;
            }
        }
    }

    reminder_args = [raw_data["BaseProductInfo"]["ProductAccount"], product_type, raw_data["Market"]];

    if (["REMOVED"].includes(reminder_args[1].toUpperCase())) {
        try {
            const pat = /\d{11}/g;

            let matches = null;
            if (raw_data["BaseProductInfo"]["CNNumber"]) {
                matches = raw_data["BaseProductInfo"]["CNNumber"].match(pat);
            } else if (raw_data["BaseProductInfo"]["ChinaPstn"]) {
                matches = raw_data["BaseProductInfo"]["ChinaPstn"].match(pat);
            }

            if (matches) {
                reminder_args.push(Number(matches[0]));
            }
        } catch (e) {
            console.log(e);
        }
    }
}

// Cache and display func acct info
const cam_info = {};
function pAHCBasicInfo(raw_data = null) {
    let acct_id = document.querySelector("#ProductDetailContainer #chooseid").value.split(",")[0];

    if (!document.getElementById("FuncAcctTitle")) {
        document.querySelector("#ProductDetailContainer #chooseid").addEventListener("change", (evt) => pAHCBasicInfo);

        let temp_h1 = document.createElement("h1");
        temp_h1.textContent = "业务账户";
        document.getElementsByClassName("AcctInfoTable")[0].insertAdjacentElement("beforebegin", temp_h1);

        temp_h1 = document.createElement("h1");
        temp_h1.textContent = "功能账户";
        temp_h1.id = "FuncAcctTitle";
        document.getElementsByClassName("AcctInfoTable")[1].insertAdjacentElement("beforebegin", temp_h1);
    }

    document.getElementById("FuncAcctTitle").textContent = `功能账户 (${acct_id})`

    let planid_elm = document.getElementById("EAAcctPlanId");
    let planname_elm = document.getElementById("EAAcctPlanName");
    let plandur_elm = document.getElementById("EAAcctContract");

    if (raw_data) {
        cam_info[acct_id] = raw_data["resultData"];
    }

    planid_elm.textContent = cam_info[acct_id]['FuncComboId'];
    planname_elm.textContent = cam_info[acct_id]['FuncComboName'];
    plandur_elm.textContent = getContractStr(cam_info[acct_id]["ActiveStartDate"], cam_info[acct_id]["FuncContractEndTime"]);

    const info_container = document.getElementById("InfoContainer");
    info_container.style.height = "";
    info_container.style.height = info_container.getBoundingClientRect().height + "px";

}

/****************************
*
* Display functions
*
*****************************/
// List open ticket
//function pCallNoteList(raw_data) {
function showTickets(acct_id) {

    const ticketListUrl = 'REMOVED/GetTicketList';

    const formData = {
        query: `{"PageData":{"StartNum":1,"EndNum":30,"PageSize":30,"PageNum":1,"MaxCount":0},"ChildBid":${acct_id}}`,
        isCancel: 'false',
        storeid: '0'
    };

    document.getElementById("TicketRoot").innerHTML = "<div id='TicketContainer' class='EASectionContent'></div>";

    const ignore_status = [
        "REMOVED"
    ];

    function onBothRequestsComplete(results) {
        raw_data = results[0]["resultData"]["TicketModels"].concat(results[1]["resultData"]["TicketModels"]);

        document.getElementById("EARoot").style.display = "";

        const tickets = []
        raw_data.forEach((elm) => {
            try {
                if (ignore_status.includes(elm["Status"].toUpperCase())) return;

                if (!elm["TicketId"]) return;

                let t = {
                    "id": elm["TicketId"],
                    "title": elm["Description"] ? elm["Description"] : elm["Title"],
                    "category": elm["CurrentCategoryName"],
                    "last_date": getDateStr(elm["LastModified"]),
                    "status": elm["Status"]
                };

                tickets.push(t);
            } catch (e) {
                return;
            }
        });

        if (tickets.length != 0) {
            const ticket_container = document.getElementById("TicketContainer");
            let ticket_html = "";

            tickets.forEach((t) => {
                ticket_html += `
                    <table class="TicketDisplay">
                        <tr>
                            <td text><a href="../../REMOVED?ticketid=${t["id"]}" target="_blank">${t["id"]}</a></td>
                            <td>${t["status"]}</td>
                        </tr>
                        <tr>
                            <td>${t["category"]}</td>
                            <td>${t["last_date"]}</td>
                        </tr>
                        <tr>
                            <td colspan=2 style="text-align: left;">${t["title"]}</td>
                        </tr>
                    </table>
                `;
            });

            ticket_container.innerHTML = ticket_html;

            makeCollapsible(ticket_container, "待处理Ticket")
        }
    }

    const normalTicket = makeRequest('POST', ticketListUrl, formData, true);

    formData.isCancel = 'true';
    const cancelTicket = makeRequest('POST', ticketListUrl, formData, true);

    Promise.all([normalTicket, cancelTicket])
        .then(onBothRequestsComplete)
        .catch(error => {
            console.error("Error fetching ticket lists:", error);
        });

    waitForElmHide("#P_CR_HistoryList").then(() => {
        document.getElementById("TicketRoot").innerHTML = "<div id='TicketContainer' class='EASectionContent'></div>";
    });
}

function showAcctInfo(raw_data) {
    document.getElementById("EARoot").style.display = "";

    // Clean content incase of consecutive trigger
    document.getElementById("InfoRoot").innerHTML = "<div id='InfoContainer' class='EASectionContent'></div>"

    // Get current acct info
    let business_accts = []
    MASTER_ACCT_INFO.list.forEach((mas) => {
        business_accts = business_accts.concat(mas.BusinessAccountList.list);
    });

    let cur_acct = null;
    const cur_acct_id = raw_data["BaseProductInfo"]["ProductAccount"];

    for (var i = 0; i < business_accts.length; i++) {
        if (business_accts[i]["BusinessAccountId"] == cur_acct_id) {
            cur_acct = business_accts[i];
            break;
        }
    }

    const info_container = document.getElementById("InfoContainer");

    info_container.insertAdjacentHTML("afterbegin", `
        <table class="AcctInfoTable">
            <tr>
                <th>注册时间</th>
                <th>激活时间</th>
                <th>出账时间</th>
            </tr>
            <tr>
                <td>${getDateStr(cur_acct["SignupDate"])}</td>
                <td>${getDateStr(cur_acct["ActivationDate"])}</td>
                <td>每月${rawToDate(cur_acct["InitialBillingDate"]).getDate()}日</td>
            </tr>
        </table>
        <div style="border: solid 1px lightgray; margin: 1em 0; border-radius: 5px;"></div>
        <table class="AcctInfoTable" style="margin-bottom: 1em;">
            <tr>
                <th>计划ID</th>
                <th colspan=2>计划名称</th>
            </tr>
            <tr>
                <td><a id="EAAcctPlanId"></a></td>
                <td colspan=2 style="text-align: left;" id="EAAcctPlanName"></td>
            </tr>
        </table>
        <table class="AcctInfoTable" style="margin-bottom: 1em;">
            <tr>
                <th>合约</th>
            </tr>
            <tr>
                <td id="EAAcctContract"></td>
            </tr>
        </table>
    `);

    if (cur_acct.BusinessType != "AHC") {

        const contract_str = getContractStr(cur_acct["ContractStartTime"], cur_acct["ContractEndTime"]);

        document.getElementById("EAAcctPlanId").textContent = cur_acct["ComboId"];
        document.getElementById("EAAcctPlanName").textContent = cur_acct["ComboName"];
        document.getElementById("EAAcctContract").textContent = contract_str;

    }

    makeCollapsible(info_container, "账户信息");

    waitForElmHide("#ProductDetailContainer #titleInfo").then(() => {
        document.getElementById("InfoRoot").innerHTML = "<div id='InfoContainer' class='EASectionContent'></div>";
        document.getElementById("PlanInfoClose").click();
    });
}

function showEasyAccess(acct_type, acct_id) {
    document.getElementById("EARoot").style.display = "";

    // Clean content incase of consecutive trigger
    document.getElementById("CSSRoot").innerHTML = "<div id='CSSContainer' class='EASectionContent'></div>"

    // Determine acct type, only BB/TV/AHC
    //const acct_type = document.querySelector("#ProductDetailContainer #titleInfo").textContent;

    if (!["BB", "AHC", "CP", "Prime", "MCN"].includes(acct_type)) {
        return null;
    }

    const access_container = document.getElementById("CSSContainer");
    access_container.innerHTML = "";

    // Define options
    //const acct_id = document.getElementById("p_account").textContent;
    const ea_btns = [];

    ea_btns.push(createButton("查看账单",
        () => open(`REMOVED${acct_id}&Culture=zh-chs&LoginType=crm&_menu_main=1`)));

    ea_btns.push(createButton("更新信用卡",
        () => open(`REMOVED${acct_id}&Culture=zh-chs&LoginType=crm`)));

    ea_btns.push(createButton("编辑个人资料",
        () => open(`REMOVED${acct_id}&Culture=zh-chs&LoginType=crm`)));

    if (acct_type == "REMOVED") {
        ea_btns.push(createButton("E911地址",
            () => open(`REMOVED${acct_id}&Culture=zh-chs&LoginType=crm&_menu_main=1&_menu_sub=3`)));

        ea_btns.push(createButton("使用记录",
            () => open(`REMOVED${acct_id}&Culture=zh-chs&LoginType=crm&_menu_main=2`)));

        ea_btns.push(createButton("Prime",
            () => open(`REMOVED${acct_id}&Culture=zh-chs&LoginType=crm&_menu_main=3&_menu_sub=1`)));
    } else if (acct_type == "REMOVED") {
        ea_btns.push(createButton("E911地址",
            () => open(`REMOVED${acct_id}&Culture=zh-chs&LoginType=crm`)));
    } else if (acct_type == "MCN") {
        ea_btns.push(createButton("使用记录",
            () => open(`REMOVED${acct_id}&Culture=zh-chs&LoginType=crm&_menu_main=1`)));
    }

    ea_btns.forEach((btn) => {
        access_container.insertAdjacentElement("beforeend", btn);
    });

    makeCollapsible(access_container, "快速访问");

    waitForElmHide("#ProductDetailContainer #p_account").then(() => {
        document.getElementById("CSSRoot").innerHTML = "";
    });
}

function showReminders(acct_id, business_name, market, cn_num=null) {
    const rem_root = document.getElementById("RemRoot");
    rem_root.innerHTML = "";

    const acct_info = {
        acct_id: acct_id,
        business: business_name,
        market: market
    }

    if (cn_num) {
        acct_info.cn_num = cn_num;
    }

    try {
         makeRequest("POST", `${AEA_SEV_URL}/reminder/acct`, acct_info)
        .then((res) => {
            pollTaskStatus(res.task_id).then((result) => {
                if (!result.length) {
                    return null;
                }

                const rem_container = document.createElement("div");
                rem_container.id = "RemContainer";

                const fixed_rem_container = document.createElement("div");
                fixed_rem_container.id = "FRemContainer";

                result.forEach((elm) => {
                    const rem_seg = elm.title.split(":");
                    let nc_type = false;
                    if (rem_seg.includes("tag")) {
                        if (!ACCT_TAG.includes(rem_seg[rem_seg.length-1].toUpperCase())) {
                           return null;
                        }
                    }

                    if (rem_seg.includes("nc")) {
                        nc_type = true;
                    }

                    const rem_item = document.createElement("div");
                    rem_item.className += "RemItem";

                    let rem_check = null;
                    if (!nc_type) {
                        rem_check = document.createElement("input");
                        rem_check.type = "checkbox";
                        rem_check.value = elm.id;
                        rem_check.addEventListener("click", (evt) => {
                            if (evt.target.checked) {
                                evt.target.nextElementSibling.style["text-decoration"] = "line-through";
                                evt.target.nextElementSibling.style["color"] = "gray";
                            } else {
                                evt.target.nextElementSibling.style["text-decoration"] = "";
                                evt.target.nextElementSibling.style["color"] = "";
                            }

                            if (rem_seg.includes("tag")) {
                                return null;
                            }
                            evt.target.disabled = true;
                            setTimeout(() => {
                                evt.target.disabled = false;
                            }, 1000);

                            const op_data = {
                                acct_id: acct_id,
                                reminder_id: elm.id,
                                processed_by: USER_INFO.Userid,
                                processed_by_xf: USER_INFO.XinfangId,
                                is_processed: evt.target.checked
                            };

                            makeRequest("POST", `${AEA_SEV_URL}/reminder/op`, op_data);
                        });

                        rem_container.insertAdjacentElement("beforeend", rem_item);
                    } else {
                        rem_check = document.createElement("div");

                        fixed_rem_container.insertAdjacentElement("beforeend", rem_item);
                    }

                    const rem_content = document.createElement("span");
                    rem_content.textContent = elm.content;

                    rem_item.insertAdjacentElement("beforeend", rem_check);
                    rem_item.insertAdjacentElement("beforeend", rem_content);

                    elm.status.is_processed = Number(elm.status.is_processed);
                    elm.recurrent_interval = Number(elm.recurrent_interval);

                    if (elm.status.is_processed && elm.recurrent_interval != 0) {
                        let temp_date = new Date(elm.status.last_processed_at)
                        let need_process = new Date() > new Date(temp_date.setDate(temp_date.getDate() + elm.recurrent_interval));

                        if ((elm.recurrent_interval < 0) || !need_process) {
                            rem_check.checked = true;
                            rem_content.style["text-decoration"] = "line-through";
                            rem_content.style["color"] = "gray";
                        }
                    }
                });

                if (fixed_rem_container.childNodes.length > 0) {
                    rem_root.insertAdjacentElement("beforeend", fixed_rem_container);
                    makeCollapsible(fixed_rem_container, "账户提醒");
                }

                if (rem_container.childNodes.length > 0) {
                    rem_root.insertAdjacentElement("beforeend", rem_container);
                    makeCollapsible(rem_container, "账户待办");
                }

            }).catch((e) => {
                console.log(e);
            });
        });
    } catch (e) {
        console.log(e);
    }

    waitForElmHide("#P_CR_HistoryList").then(() => {
        document.getElementById("RemRoot").innerHTML = "";
    });
}

/******************
*
* Helper functions
*
*******************/
function dragElement(elm) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.querySelector(elm.id + "Title")) {
        document.getElementById(elm.id + "Title").onmousedown = dragMouseDown;
    } else {
        elm.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();

        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;

        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();

        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        elm.style.top = (elm.offsetTop - pos2) + "px";
        elm.style.left = (elm.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function getContractStr(start_raw, end_raw) {
    let start_str = getDateStr(start_raw);

    let end_str = getDateStr(end_raw, true);

    if (rawToDate(end_raw) < new Date("2000")) {
        return "无合约";
    }

    return `${start_str}-${end_str}`;
}

function rawToDate(raw_date) {
    return new Date(Number(raw_date.match(/-?\d+/g)[0]));
}

const DATETIME_FORMAT = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' });
function getDateStr(raw_date, sub_day=false) {
    processed_date = rawToDate(raw_date)

    if (sub_day) {
        processed_date = new Date(processed_date.setDate(processed_date.getDate() - 1));
    }

    try {
        return processed_date <= new Date("2000") ? "N/A" : DATETIME_FORMAT.formatToParts(processed_date).map((p) => p.value).join('');
    } catch (e) {
        console.error(e);
        return false;
    }
}

function makeCollapsible(element, heading_text) {
    const container = document.createElement('div');
    container.className = "EASectionTitle";

    // Create button
    const button = document.createElement('button');
    button.textContent = '▼'; // Downward triangle

    // Create h1
    const heading = document.createElement('h1');
    heading.textContent = heading_text;
    heading.addEventListener('click', () => { button.click(); });

    element.style.height = element.offsetHeight + 'px';

    // Event listener
    button.addEventListener('click', () => {
        if (element.style.height === '0px') {
            //Expand
            element.style.height = element.dataset.originalHeight + 'px';
            button.textContent = '▼';

        } else {
            //Collapse
            element.dataset.originalHeight = element.getBoundingClientRect().height;
            element.style.height = '0px';
            button.textContent = '►';
        }

        button.disabled = true;
        setTimeout(() => {
            button.disabled = false
        }, 350);
    });

    // Insert elements before the target element
    container.insertAdjacentElement("afterbegin", heading);
    container.insertAdjacentElement("afterbegin", button);

    element.parentNode.insertBefore(container, element);
}

function createButton(text, onClick) {
    const button = document.createElement("button");
    button.textContent = text;
    button.onclick = onClick;
    return button;
}

function waitForElmHide(selector) {
    return new Promise(resolve => {
        if (!document.querySelector(selector)) {
            return resolve(true);
        }

        if (document.querySelector(selector).offsetParent == null) {
            return resolve(true);
        }

        const observer = new MutationObserver(mutations => {
            try {
                if (!document.querySelector(selector)) {
                    return resolve(true);
                }

                if (document.querySelector(selector).offsetParent == null) {
                    return resolve(true);
                }
            } catch (e) { console.log(e) }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function makeRequest(method, url, data, form=false) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: method,
            url: url,
            headers: {
                'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json'
            },
            // Format data based on the 'form' flag
            data: data ? (form ? new URLSearchParams(data).toString() : JSON.stringify(data)) : undefined,
            onload: function (response) {
                try {
                    resolve(JSON.parse(response.responseText));
                } catch (error) {
                    reject(new Error(`Invalid JSON response, ${response.responseText}`));
                }
            },
            onerror: function (error) {
                // Provide more detailed error information
                reject(new Error(`Request failed: ${error.status} - ${error.statusText}, ${error}`));
            }
        });
    });
}
/******************
*
* Elements setup
*
*******************/
document.body.insertAdjacentHTML('afterbegin', `
    <div id="EARoot">
        <div id="RemRoot"></div>
        <div id="CSSRoot"></div>
        <div id="InfoRoot"></div>
        <div id="TicketRoot">
            <div id='TicketContainer' class='EASectionContent'></div>
        </div>
    </div>

    <div id="PlanInfoRoot">
        <div id="PlanInfoTitle">
            <h1 style="cursor: move; text-align: center; font-size: 20px; margin-bottom: 5px;">计划内容</h1>
            <button id="PlanInfoClose">X</button>
        </div>
        <div id="PlanInfoContent">
            <table class="PlanInfoTable">
                <tr>
                    <td>计划ID</td>
                    <td id="PlanInfoID"></td>
                </tr>
                <tr>
                    <td>计划名称</td>
                    <td id="PlanInfoName"></td>
                </tr>
                <tr>
                    <td>合约</td>
                    <td id="PlanInfoContract"></td>
                </tr>
                <tr>
                    <td>费用</td>
                    <td id="PlanInfoFee"></td>
                </tr>
            </table>
            <table class="PlanInfoTable">
                <tr>
                    <td>计划优惠</td>
                    <td id="PlanInfoDiscount" style="white-space:pre-line; text-align:left;"></td>
                </tr>
                <tr>
                    <td>备注</td>
                    <td id="PlanInfoNote" style="white-space:pre-line; text-align:left;"></td>
                </tr>
            </table>
        </div>
        <div id="PlanInfoFail" style="display: none;">
            <h1 style="font-size: 20px; height: 3em; width: 8em; text-align: center">提取失败！</h1>
        </div>
        <div id="PlanInfoLoad" style="display: none;">
            <h1 style="font-size: 20px; height: 3em; width: 8em; text-align: center">读取中。。。</h1>
        </div>
    </div>
`);

document.getElementById("EARoot").style.display = "none";

GM_addStyle(`
    #PlanInfoRoot {
        position: absolute;
        top: 65%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9992;

        border: 1px solid black;
        border-radius: 3px;
        box-shadow: 2px 2px 5px;

        background-color: #fff;
        padding: 8px;

        font: 12px Tahoma, Geneva, sans-serif, Arial, Helvetica;
    }

    #PlanInfoTitle {
        display: grid;
        grid-template-columns: auto 1.5em;
        border-bottom:2px solid #808080;
    }

    #PlanInfoClose {
        background: none;
        border: none;
        margin-left: -2px;
        margin-top: -8px;

        width: 28px;
        cursor: pointer;
    }

    #PlanInfoClose:hover {
        background-color: #eee;
    }

    #PlanInfoContent {
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: 1em;
        margin: 1em;
        max-width: 450px;
    }

    .PlanInfoTable tr td:first-child {
        background-color: #DBDBDB;
        width: 30px;
    }

    #EARoot {
        position: fixed;
        left: 10px;
        top: 10px;
        bottom: 10px;

        border-radius: 5px;
        background-color: white;
        filter: drop-shadow(black 2px 2px 5px);

        width: 20em;

        overflow-x: scroll;
    }

    #CSSContainer {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-column-gap: 1em;
        grid-row-gap: 1em;

        transition: height 0.3s ease-out;
        overflow: hidden;
    }

    #CSSContainer button {
        padding: 3px;
    }

    #TicketContainer, #InfoContainer, #RemContainer {
        transition: height 0.3s ease-out;
        overflow: hidden;
    }

    #RemContainer {
        margin: 0 1em;
    }

    .RemItem {
        border-bottom: solid 1px gray;
        padding: 1em;
        display: grid;
        grid-template-columns: 0.3fr 1fr;
    }

    .RemItem:last-child {
        border: none;
    }

    .RemItem input {
        height: 16px;
    }

    .RemItem span {
        white-space: pre-line;
    }

    #InfoContainer h1 {
        margin: 0.5em;
        width: 100%;
        text-align: center;
    }

    .EASectionTitle {
        display: flex;
        border-radius: 5px;
        background-color: white;
        filter: drop-shadow(gray 1px 0px 3px);
    }

    .EASectionTitle button {
        border: none;
        width: 3em;
        background: inherit;
        cursor: pointer;
    }

    .EASectionTitle h1 {
        height: 3em;
        width: 100%;
        cursor: pointer;
        align-content: center;
    }

    .EASectionContent {
        margin: 1em;
        margin-left: 1.5em;
    }

    .TicketDisplay {
        margin-bottom: 1em;
    }

    .TicketDisplay td, .AcctInfoTable td, .AcctInfoTable th, .PlanInfoTable td {
        padding: 3px;
        text-align: center;
    }

    .AcctInfoTable th {
        background-color: #DBDBDB;
        font-weight: normal;
    }

    .AcctInfoTable, .TicketDisplay, .PlanInfoTable {
        width: 100%;
        border-collapse: separate;
    }

    .TicketDisplay td, .AcctInfoTable td, .AcctInfoTable th, .PlanInfoTable td {
        border-right: 1px solid gray;
        border-bottom: 1px solid gray;
    }

    .AcctInfoTable tr th:first-child,
    .AcctInfoTable tr td:first-child,
    .PlanInfoTable tr td:first-child,
    .TicketDisplay tr td:first-child {
        border-left: 1px solid gray;
    }

    .AcctInfoTable tr:first-child th,
    .AcctInfoTable tr:first-child td,
    .PlanInfoTable tr:first-child td,
    .TicketDisplay tr:first-child td {
        border-top: 1px solid gray;
    }

    .AcctInfoTable tr:first-child th:first-child,
    .PlanInfoTable tr:first-child td:first-child,
    .TicketDisplay tr:first-child td:first-child {
        border-top-left-radius: 3px;
    }

    .AcctInfoTable tr:first-child th:last-child,
    .PlanInfoTable tr:first-child td:last-child,
    .TicketDisplay tr:first-child td:last-child {
        border-top-right-radius: 3px;
    }

    .AcctInfoTable tr:last-child td:first-child,
    .PlanInfoTable tr:last-child td:first-child,
    .TicketDisplay tr:last-child td:first-child {
        border-bottom-left-radius: 3px;
    }

    .AcctInfoTable tr:last-child td:last-child,
    .PlanInfoTable tr:last-child td:last-child,
    .TicketDisplay tr:last-child td:last-child {
        border-bottom-right-radius: 3px;
    }
`);

/****************************
*
* Other adjustments
*
*****************************/
function waitForElm(selector, exist = false) {
    return new Promise(resolve => {
        try {
            if (((!exist) && (document.querySelector(selector).offsetParent != null)) || (exist && document.querySelector(selector))) {
                return resolve(document.querySelector(selector));
            }
        } catch (e) {

        }

        const observer = new MutationObserver(mutations => {
            try {
                if ((!exist) && (document.querySelector(selector).offsetParent != null)) {
                    observer.disconnect();
                    return resolve(document.querySelector(selector));
                } else if (exist && document.querySelector(selector)) {
                    observer.disconnect();
                    return resolve(document.querySelector(selector));
                }
            } catch (e) {
                //console.log(e);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function modifyAHCOption() {
    waitForElm("#ProductDetailContainer #chooseid").then(() => {
        waitForElm("#ProductDetailContainer #chooseid option", true).then(() => {
            document.getElementById("chooseid").querySelectorAll("option").forEach((opt) => {
                if (!(opt.textContent.includes("-"))) {
                    opt.textContent = `(${opt.value.split(",")[0]}) - ` + opt.textContent;
                }
            });

            waitForElmHide("#ProductDetailContainer #chooseid").then(() => {
                modifyAHCOption();
            });
        });
    });
}

function stopAHCPlanHover() {
    waitForElm("#ProductDetailContainer #func_sp_plan_des").then((elm) => {
        const observer = new MutationObserver(mutations => {
            try {
                if (elm.textContent.trim().length > 10) {
                    let clone = elm.cloneNode(true);
                    elm.parentNode.replaceChild(clone, elm);
                }
            } catch (e) {
                console.log(e);
            } finally {
                observer.disconnect();
            }
        });

        observer.observe(document.querySelector("#ProductDetailContainer #func_sp_plan_des"), {
            childList: true,
            subtree: true
        });

        waitForElmHide("#ProductDetailContainer #func_sp_plan_des").then(() => {
            observer.disconnect();
            stopAHCPlanHover();
        });
    });
}

modifyAHCOption();
stopAHCPlanHover();

async function pollTaskStatus(taskId) {
    let attempts = 0;
    const maxAttempts = 10;
    const interval = 1000; // 1 second

    while (attempts < maxAttempts) {
        try {
            const taskData = await makeRequest('GET', `${AEA_SEV_URL}/tasks/${taskId}`);

            if (taskData.status === 'SUCCESS') {
                return taskData.result;
            } else if (taskData.status === 'FAILURE') {
                throw new Error(taskData.message || '上传失败');
            } // else, keep polling (PENDING)
        } catch (error) {
            console.error('Error polling task status:', error);
            throw error; // Re-throw to be caught by the calling function
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('连接超时');
}


/****************************
*
* Plan Popup functions
*
*****************************/
document.getElementById("PlanInfoRoot").style.display = "none";
dragElement(document.getElementById("PlanInfoRoot"));

document.getElementById("PlanInfoClose").addEventListener("click", () => {
    document.getElementById("PlanInfoRoot").style.display = "none";
});

attachToPlanID();

function attachToPlanID() {
    waitForElm("#EAAcctPlanId", true).then(() => {
        document.getElementById("EAAcctPlanId").addEventListener("click", (evt) => {
            displayPlanInfo(evt.target.textContent);
        });

        waitForElmHide("#EAAcctPlanId").then(() => {
            attachToPlanID();
        });
    });
}

function displayPlanInfo(target_plan) {
    if (target_plan.length != 6) {
        return null;
    }

    document.getElementById("PlanInfoRoot").style.display = "";

    const plan_info_fields = ["PlanInfoID", "PlanInfoName", "PlanInfoContract", "PlanInfoFee", "PlanInfoDiscount", "PlanInfoNote"];
    plan_info_fields.forEach((f) => {
        document.getElementById(f).textContent = "";
    });

    document.getElementById("PlanInfoContent").style.display = "none";
    document.getElementById("PlanInfoFail").style.display = "none";
    document.getElementById("PlanInfoLoad").style.display = "";

    try {
         makeRequest("GET", `${AEA_SEV_URL}/plan/${target_plan}`)
        .then((res) => {
            pollTaskStatus(res.task_id).then((result) => {
                if (!result) {
                    throw new Error("Plan not found");
                }

                document.getElementById("PlanInfoContent").style.display = "";
                document.getElementById("PlanInfoLoad").style.display = "none";

                document.getElementById("PlanInfoID").textContent = result.plan_id;
                document.getElementById("PlanInfoName").textContent = result.name;
                document.getElementById("PlanInfoContract").textContent = result.contract;
                document.getElementById("PlanInfoFee").textContent = result.fee;
                document.getElementById("PlanInfoDiscount").textContent = result.discount;
                document.getElementById("PlanInfoNote").textContent = result.note;
            }).catch((e) => {
                console.log(e);
                document.getElementById("PlanInfoFail").style.display = "";
                document.getElementById("PlanInfoLoad").style.display = "none";
            });
        });

    } catch (e) {
        console.log(e);
        document.getElementById("PlanInfoFail").style.display = "";
        document.getElementById("PlanInfoLoad").style.display = "none";
    }
}