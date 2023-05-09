const { Client, PermissionsBitField } = require('discord.js');
const { developerList, defaultMemberRoleID, employeeRoleID } = require('./config.json');
const { blacklisted_words } = require('./blacklist.json');

module.exports = {
    async INTERNAL_DEVELOPER(userId){
        let isFlagged;
        for (let i = 0; i < developerList.length; i++){
            if (userId !== developerList[i]){
                continue;
            } else {
                isFlagged = true;
                break;
            }
        }
        return isFlagged;
    },

    async INTERNAL_CACTUS(user){ // users that can submit reaction ideas
        let isFlagged;
        if (user.roles.cache.some(role => role.id === defaultMemberRoleID)) {
            isFlagged=true;
        } else { 
            isFlagged=false;
        }
        return isFlagged;
    },

    async INTERNAL_EMPLOYEE(user){ // TBNR Employees
        let isFlagged;
        if (user.roles.cache.some(role => role.id === employeeRoleID)) {
            isFlagged=true;
        } else { 
            isFlagged=false;
        }
        return isFlagged;
    },

    async CONTAINS_BLACKLISTED(string){
        let isFlagged;
        for (var i=0; i<blacklisted_words.length; i++) {
            if (string.includes(blacklisted_words[i])) {
                isFlagged=true;
                break;
            }
        }
        return isFlagged;
    },
}