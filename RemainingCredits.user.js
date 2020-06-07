// ==UserScript==
// @name         Remaining Credits
// @namespace    https://leitstellenspiel.de
// @version      1.0.1
// @description  Berechnet zu verdienende Credits der derzeitigen Einsatzliste
// @author       Lennard[TFD] | Piet2001
// @match        https://www.meldkamerspel.com/
// ==/UserScript==

(function() {
    'use strict';

    var requirements;
    var mutationObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {

            var node = mutation.addedNodes[0];
            //console.log(node);
            if ((!mutation.oldValue || !mutation.oldValue.match(/\bmission_deleted\b/))
                && mutation.target.classList
                && mutation.target.classList.contains('mission_deleted')){
                calculate();
                //alert('mission_deleted class added');
            }
            else if(node != undefined)
            {
                setupListener($(node));
                calculate();
            }

        });
    });

    function getRequirements()
    {
        return new Promise(resolve => {
            $.ajax({
                url: "https://www.meldkamerspel.com/einsaetze.json",
                method: "GET",
            }).done((res) => {
                resolve(res);
            });
        });
    }

    function setupListener(mission)
    {
        mutationObserver.observe(mission[0], {
            attributes: true,
            attributeOldValue: true,
            attributeFilter: ['class']
        });
    }

    function beautifyCredits(credits)
    {
        return credits.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    }

    async function init()
    {

        let filterDiv = $("#btn-group-mission-select");
        let html = `<br><br>
                    <span>Te verdienen: <span id='remCredits'>0 / 0</span> Credits</span>
                    `;
        let filterBtns = filterDiv.append(html);

        //console.log(await getCredits(3));
        if(sessionStorage.getItem("LSS_MissionCache") == null)
        {
            requirements = await getRequirements();
            sessionStorage.setItem("LSS_MissionCache", JSON.stringify(requirements));
        }
        else
        {
            requirements = JSON.parse(sessionStorage.getItem("LSS_MissionCache"));
        }

        var missionList = $("#missions-panel-body");
        var missions = missionList.find("a[id*='alarm_button']");

        missions.each((e, t) => {
            setupListener($(t).parent().parent().parent());
        });

        mutationObserver.observe($("#missions-panel-body")[0], {
            childList: true,
        });

        calculate();
    }



    function calculate()
    {
        var credits = 0;
        var creditsAlliance = 0;
        var missionList = $("#missions-panel-body");
        var missions = missionList.find("a[id*='alarm_button']").parent().parent().parent().not("[class*='mission_deleted']").not("[class*='mission_alliance_distance_hide']");
        missions.each(async (e, t) => {
            //if($(t).parent().css("display") == "none") return;
            var missionId = $(t).attr("mission_type_id");
            if(missionId == "null") return;
            let mission = requirements.filter(e => e.id == parseInt(missionId))[0];
            if(mission == undefined)
            {
                requirements = await getRequirements();
                mission = requirements.filter(e => e.id == parseInt(missionId))[0];
            }
            //var missionCredits = requirements[parseInt(missionId)].average_credits || 250;
            var missionCredits = mission.average_credits || 250;
            if(!$(t).parent().attr("id").includes("alliance"))
            {
                credits += missionCredits;
            }
            else
            {
                creditsAlliance += missionCredits;
            }
        });
        $("#remCredits").text(beautifyCredits(credits) + " / " + beautifyCredits(creditsAlliance));
        //console.log(credits);
    }
    init();
})();
