const Discord = require('discord.js');
const https = require('https');
const striptags = require('striptags');
const fs = require('fs');
const { Client, RichEmbed } = require('discord.js');
const client = new Client();

var cooldown = 5;
var prefix = "!";
var version = "1.3.2";

var list = fs.readFileSync('list.txt', 'utf8').split(/\n/);
var list_single = new Array();
list.forEach(function(f, i) {
    list_single[i] = "`"+f+"`"
})
var list_double = new Array();
list.forEach(function(f, i) {
    list_double[i] = "``"+f+"``"
})

if (fs.existsSync('channels.txt')) {
    var channels = fs.readFileSync('channels.txt', 'utf8').split(/, \n/);
    channels.pop()
    console.log(channels)
} else {
    var channels = []
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({ game: { name: prefix+'wiki <search>' }})
});

function fixUpperCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function removeBacktick(str) {
    return str.replace(/`/g, '')
}

function isMod(member) {
    if (member.hasPermission("MANAGE_MESSAGES", false, true, true)) {
        return true
    } else {
        return false
    }
}

function isAllowed(id) {
    return channels.includes(id)
}

function setAllowed(id) {
    channels.push(id)
    saveAllowed()
    return true
}

function setDenied(id) {
    var i = channels.indexOf(id);
    if (i !== -1) {
        channels.splice(i, 1);
        saveAllowed()
        return true
    } else {
        return false
    }
}

function saveAllowed() {
    var file = fs.createWriteStream('channels.txt');
    file.on('error', function(err) { /* error handling */ });
    channels.forEach(function(v) { file.write(v+', '+ '\n'); });
    file.end();
}

client.on('message', message => {
    if (isAllowed(message.channel.id) || message.channel.type == "dm") {
        let args = message.content.split(" ");

        var match = args.filter(element => list_single.includes(element))
    
        if (args[0] === prefix+"wiki") {
            if (args[1] === "deny" && message.channel.type == "text") {
                if (isMod(message.member)) {
                    if (setDenied(message.channel.id)) {
                        let embed = new RichEmbed();
                        embed.setTitle("Channel denied.")
                        embed.setColor("RED")
                        message.channel.send(embed);
                    } else {
                        let embed = new RichEmbed();
                        embed.addField("ERROR: Something went wrong...")
                        embed.setColor("RED")
                        message.channel.send(embed);
                    }
                    
                }
            } else if (args[1] == null || args[1] === "usage") {
                let embed = new RichEmbed();
                embed.addField("Commands Usage:", prefix+"wiki <function or event>\nExamples: \n"+prefix+"wiki outputChatBox\n"+prefix+"wiki outputChatBox args\n"+prefix+"wiki outputChatBox example")
                embed.setURL("https://wiki.multitheftauto.com/wiki/"+args[1])
                embed.setColor("RED")
                message.channel.send(embed);
            } else if (args[1].search(/special:/i) != -1) {
                let embed = new RichEmbed();
                embed.setDescription("Access denied!")
                embed.setURL("https://wiki.multitheftauto.com/wiki/"+args[1])
                embed.setColor("RED")
                message.channel.send(embed);
            } else if (args[1] === "info") {
                let embed = new RichEmbed();
                embed.addField("Bot Information:", "Version: **"+version+"\n**Author: **@Deihim007#0855**\nAll rights reserved for **MTASA©**")
                embed.setURL("https://wiki.multitheftauto.com/wiki/"+args[1])
                embed.setColor("AQUA")
                message.channel.send(embed);
            } else if (args[1] && args[2]) {
                console.log("called")
                fetchWikiData(fixUpperCase(args[1]), message, args[2])
            } else if (args[1]) {
                console.log("called")
                fetchWikiData(fixUpperCase(args[1]), message, null)
            }
        } else if (match.length > 0) {
            if (match[0]) {
                fetchWikiData(fixUpperCase(removeBacktick(match[0])), message, null, true)
            }
            if (match[1]) {
                fetchWikiData(fixUpperCase(removeBacktick(match[1])), message, null, true)
            }
            if (match[2]) {
                fetchWikiData(fixUpperCase(removeBacktick(match[2])), message, null, true)
            }
        }
    } else {
        let args = message.content.split(" ");
        if (args[0] === prefix+"wiki" && args[1] === "allow" &&  message.channel.type == "text" && isMod(message.member)) {
            if (setAllowed(message.channel.id)) {
                let embed = new RichEmbed();
                embed.setTitle("Channel allowed.")
                embed.setColor("RED")
                message.channel.send(embed);
            } else {
                let embed = new RichEmbed();
                embed.setTitle("ERROR: Something went wrong...")
                embed.setColor("RED")
                message.channel.send(embed);
            }
        }
    }
});

function fetchWikiData(title, message, part, inline) {
    var normal_title = title
    let body = [];
    var options = {
        host: 'wiki.multitheftauto.com',
        port: 443,
        path: '/wiki/'+title
    };
      
    https.get(options, function(res) {
    console.log("Got response: " + res.statusCode);
    
    res.on("data", function(chunk) {
        body.push(chunk);
    });
    res.on("end", function() {
        body = Buffer.concat(body).toString();
        processWikiData(striptags(body), normal_title, message, part, inline);
    })
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
}

var tags = {
    beforeTitle: "wgCategories\":[\"",
    afterTitle: "\"],\"wgBreakFrames",
    desc: "Jump to:navigation, search",
    syntax: "Syntax",
    oop: "OOP Syntax Help! I don't understand this!",
    reqArgs: "Required Arguments",
    optArgs: "Optional Arguments",
    returns: "Returns",
    example: "Example",
    changelog: "Changelog",
    seeAlso: "See Also",
    footer: "Retrieved from",
    parameters: "Parameters",
    source: "Source"
};

function determineType(types) {
    var serverFunction = ["Server functions", "Server function", "Server Functions", "Server Function"];
    var clientFunction = ["Client functions", "Client function", "Client Functions", "Client Function"];
    var serverEvent = ["Server events", "Server event", "Server Events", "Server Event"];
    var clientEvent = ["Client events", "Client event", "Client Events", "Client Event"];
    var usefulFunction = ["Useful functions", "Useful function", "Useful Functions", "Useful Function"];
    for (i = 0; i < types.length; i++) {
        for (j = 0; j < serverFunction.length; j++) {
            if (types[i] === serverFunction[j]) {
                for (k = 0; k < types.length; k++) {
                    for (o = 0; o < clientFunction.length; o++) {
                        if (types[k] === clientFunction[o]) {
                            return "SharedFunction"
                        }
                    }
                }
            }
        }
    }
    for (i = 0; i < types.length; i++) {
        for (j = 0; j < serverFunction.length; j++) {
            if (types[i] === serverFunction[j]) {
                return "ServerFunction"
            }
        }
    }
    for (i = 0; i < types.length; i++) {
        for (j = 0; j < clientFunction.length; j++) {
            if (types[i] === clientFunction[j]) {
                return "ClientFunction"
            }
        }
    }
    for (i = 0; i < types.length; i++) {
        for (j = 0; j < usefulFunction.length; j++) {
            if (types[i] === usefulFunction[j]) {
                return "UsefulFunction"
            }
        }
    }
    for (i = 0; i < types.length; i++) {
        for (j = 0; j < serverEvent.length; j++) {
            if (types[i] === serverEvent[j]) {
                return "ServerEvent"
            }
        }
    }
    for (i = 0; i < types.length; i++) {
        for (j = 0; j < clientEvent.length; j++) {
            if (types[i] === clientEvent[j]) {
                return "ClientEvent"
            }
        }
    }
}

function processFunction(body) {
    let description = {};
    if (body.indexOf(tags.desc) != -1) {
        if (body.indexOf(tags.syntax) != -1) {
            description.description = body.substring(body.indexOf(tags.desc)+tags.desc.length, body.indexOf(tags.syntax)-1);
        } else if (body.indexOf(tags.oop) != -1) {
            description.description = body.substring(body.indexOf(tags.desc)+tags.desc.length, body.indexOf(tags.oop)-1);
        } else if (body.indexOf(tags.reqArgs) != -1) {
            description.description = body.substring(body.indexOf(tags.desc)+tags.desc.length, body.indexOf(tags.reqArgs)-1);
        } else if (body.indexOf(tags.optArgs) != -1) {
            description.description = body.substring(body.indexOf(tags.desc)+tags.desc.length, body.indexOf(tags.optArgs)-1);
        } else if (body.indexOf(tags.returns) != -1) {
            description.description = body.substring(body.indexOf(tags.desc)+tags.desc.length, body.indexOf(tags.returns)-1);
        } else if (body.indexOf(tags.example) != -1) {
            description.description = body.substring(body.indexOf(tags.desc)+tags.desc.length, body.indexOf(tags.example)-1);
        } else if (body.indexOf(tags.changelog) != -1) {
            description.description = body.substring(body.indexOf(tags.desc)+tags.desc.length, body.indexOf(tags.changelog)-1);
        } else if (body.indexOf(tags.seeAlso) != -1) {
            description.description = body.substring(body.indexOf(tags.desc)+tags.desc.length, body.indexOf(tags.seeAlso)-1);
        } else if (body.indexOf(tags.footer) != -1) {
            description.description = body.substring(body.indexOf(tags.desc)+tags.desc.length, body.indexOf(tags.footer)-1);
        }
    } else {
        description.description = ("Not found!");
    }
    if (body.indexOf(tags.syntax) != -1) {
        if (body.indexOf(tags.oop) != -1) {
            description.syntax = body.substring(body.indexOf(tags.syntax)+tags.syntax.length, body.indexOf(tags.oop)-1);
        } else if (body.indexOf(tags.reqArgs) != -1) {
            description.syntax = body.substring(body.indexOf(tags.syntax)+tags.syntax.length, body.indexOf(tags.reqArgs)-1);
        } else if (body.indexOf(tags.optArgs) != -1) {
            description.syntax = body.substring(body.indexOf(tags.syntax)+tags.syntax.length, body.indexOf(tags.optArgs)-1);
        } else if (body.indexOf(tags.returns) != -1) {
            description.syntax = body.substring(body.indexOf(tags.syntax)+tags.syntax.length, body.indexOf(tags.returns)-1);
        } else if (body.indexOf(tags.example) != -1) {
            description.syntax = body.substring(body.indexOf(tags.syntax)+tags.syntax.length, body.indexOf(tags.example)-1);
        } else if (body.indexOf(tags.changelog) != -1) {
            description.syntax = body.substring(body.indexOf(tags.syntax)+tags.syntax.length, body.indexOf(tags.changelog)-1);
        } else if (body.indexOf(tags.seeAlso) != -1) {
            description.syntax = body.substring(body.indexOf(tags.syntax)+tags.syntax.length, body.indexOf(tags.seeAlso)-1);
        } else if (body.indexOf(tags.footer) != -1) {
            description.syntax = body.substring(body.indexOf(tags.syntax)+tags.syntax.length, body.indexOf(tags.footer)-1);
        }
    } else {
        description.syntax = ("Not found!");
    }
    if (body.indexOf(tags.oop) != -1) {
        if (body.indexOf(tags.reqArgs) != -1) {
            description.oop = body.substring(body.indexOf(tags.oop)+tags.oop.length, body.indexOf(tags.reqArgs)-1);
        } else if (body.indexOf(tags.optArgs) != -1) {
            description.oop = body.substring(body.indexOf(tags.oop)+tags.oop.length, body.indexOf(tags.optArgs)-1);
        } else if (body.indexOf(tags.returns) != -1) {
            description.oop = body.substring(body.indexOf(tags.oop)+tags.oop.length, body.indexOf(tags.returns)-1);
        } else if (body.indexOf(tags.example) != -1) {
            description.oop = body.substring(body.indexOf(tags.oop)+tags.oop.length, body.indexOf(tags.example)-1);
        } else if (body.indexOf(tags.changelog) != -1) {
            description.oop = body.substring(body.indexOf(tags.oop)+tags.oop.length, body.indexOf(tags.changelog)-1);
        } else if (body.indexOf(tags.seeAlso) != -1) {
            description.oop = body.substring(body.indexOf(tags.oop)+tags.oop.length, body.indexOf(tags.seeAlso)-1);
        } else if (body.indexOf(tags.footer) != -1) {
            description.oop = body.substring(body.indexOf(tags.oop)+tags.oop.length, body.indexOf(tags.footer)-1);
        }
    } else {
        description.oop = ("Not found!");
    }
    if (body.indexOf(tags.reqArgs) != -1) {
        if (body.indexOf(tags.optArgs) != -1) {
            description.reqArgs = body.substring(body.indexOf(tags.reqArgs)+tags.reqArgs.length, body.indexOf(tags.optArgs)-1);
        } else if (body.indexOf(tags.returns) != -1) {
            description.reqArgs = body.substring(body.indexOf(tags.reqArgs)+tags.reqArgs.length, body.indexOf(tags.returns)-1);
        } else if (body.indexOf(tags.example) != -1) {
            description.reqArgs = body.substring(body.indexOf(tags.reqArgs)+tags.reqArgs.length, body.indexOf(tags.example)-1);
        } else if (body.indexOf(tags.changelog) != -1) {
            description.reqArgs = body.substring(body.indexOf(tags.reqArgs)+tags.reqArgs.length, body.indexOf(tags.changelog)-1);
        } else if (body.indexOf(tags.seeAlso) != -1) {
            description.reqArgs = body.substring(body.indexOf(tags.reqArgs)+tags.reqArgs.length, body.indexOf(tags.seeAlso)-1);
        } else if (body.indexOf(tags.footer) != -1) {
            description.reqArgs = body.substring(body.indexOf(tags.reqArgs)+tags.reqArgs.length, body.indexOf(tags.footer)-1);
        }
    } else {
        description.reqArgs = ("Not found!");
    }
    if (body.indexOf(tags.optArgs) != -1) {
        if (body.indexOf(tags.returns) != -1) {
            description.optArgs = body.substring(body.indexOf(tags.optArgs)+tags.optArgs.length, body.indexOf(tags.returns)-1);
        } else if (body.indexOf(tags.example) != -1) {
            description.optArgs = body.substring(body.indexOf(tags.optArgs)+tags.optArgs.length, body.indexOf(tags.example)-1);
        } else if (body.indexOf(tags.changelog) != -1) {
            description.optArgs = body.substring(body.indexOf(tags.optArgs)+tags.optArgs.length, body.indexOf(tags.changelog)-1);
        } else if (body.indexOf(tags.seeAlso) != -1) {
            description.optArgs = body.substring(body.indexOf(tags.optArgs)+tags.optArgs.length, body.indexOf(tags.seeAlso)-1);
        } else if (body.indexOf(tags.footer) != -1) {
            description.optArgs = body.substring(body.indexOf(tags.optArgs)+tags.optArgs.length, body.indexOf(tags.footer)-1);
        }
    } else {
        description.optArgs = ("Not found!");
    }
    if (body.indexOf(tags.returns) != -1) {
        if (body.indexOf(tags.example) != -1) {
            description.returns = body.substring(body.indexOf(tags.returns)+tags.returns.length, body.indexOf(tags.example)-1);
        } else if (body.indexOf(tags.changelog) != -1) {
            description.returns = body.substring(body.indexOf(tags.returns)+tags.returns.length, body.indexOf(tags.changelog)-1);
        } else if (body.indexOf(tags.seeAlso) != -1) {
            description.returns = body.substring(body.indexOf(tags.returns)+tags.returns.length, body.indexOf(tags.seeAlso)-1);
        } else if (body.indexOf(tags.footer) != -1) {
            description.returns = body.substring(body.indexOf(tags.returns)+tags.returns.length, body.indexOf(tags.footer)-1);
        }
    } else {
        description.returns = ("Not found!");
    }
    if (body.indexOf(tags.example) != -1) {
        if (body.indexOf(tags.changelog) != -1) {
            description.example = body.substring(body.indexOf(tags.example)+tags.example.length, body.indexOf(tags.changelog)-1);
        } else if (body.indexOf(tags.seeAlso) != -1) {
            description.example = body.substring(body.indexOf(tags.example)+tags.example.length, body.indexOf(tags.seeAlso)-1);
        } else if (body.indexOf(tags.footer) != -1) {
            description.example = body.substring(body.indexOf(tags.example)+tags.example.length, body.indexOf(tags.footer)-1);
        }
    } else {
        description.example = ("Not found!");
    }
    if (body.indexOf(tags.changelog) != -1) {
        if (body.indexOf(tags.seeAlso) != -1) {
            description.changelog = body.substring(body.indexOf(tags.changelog)+tags.changelog.length, body.indexOf(tags.seeAlso)-1);
        } else if (body.indexOf(tags.footer) != -1) {
            description.changelog = body.substring(body.indexOf(tags.changelog)+tags.changelog.length, body.indexOf(tags.footer)-1);
        }
    } else {
        description.changelog = ("Not found!");
    }
    if (body.indexOf(tags.seeAlso) != -1) {
        if (body.indexOf(tags.footer) != -1) {
            description.seeAlso= body.substring(body.indexOf(tags.seeAlso)+tags.seeAlso.length, body.indexOf(tags.footer)-1);
        }
    } else {
        description.seeAlso= ("Not found!");
    }
    return description;
}

function processEvent(body) {
    let description = {};
    if (body.indexOf(tags.desc) != -1) {
        if (body.indexOf(tags.parameters) != -1) {
            description.description = body.substring(body.indexOf(tags.desc)+tags.desc.length, body.indexOf(tags.parameters)-1);
        } else if (body.indexOf(tags.source) != -1) {
            description.description = body.substring(body.indexOf(tags.desc)+tags.desc.length, body.indexOf(tags.source)-1);
        } else if (body.indexOf(tags.example) != -1) {
            description.description = body.substring(body.indexOf(tags.desc)+tags.desc.length, body.indexOf(tags.example)-1);
        } else if (body.indexOf(tags.changelog) != -1) {
            description.description = body.substring(body.indexOf(tags.desc)+tags.desc.length, body.indexOf(tags.changelog)-1);
        } else if (body.indexOf(tags.seeAlso) != -1) {
            description.description = body.substring(body.indexOf(tags.desc)+tags.desc.length, body.indexOf(tags.seeAlso)-1);
        } else if (body.indexOf(tags.footer) != -1) {
            description.description = body.substring(body.indexOf(tags.desc)+tags.desc.length, body.indexOf(tags.footer)-1);
        }
        if (description.description.length > 1023) {
            description.description = description.description.substring(0, 2040)+"..."
        }
    } else {
        description.description = ("Not found!");
    }
    if (body.indexOf(tags.parameters) != -1) {
        if (body.indexOf(tags.source) != -1) {
            description.parameters = body.substring(body.indexOf(tags.parameters)+tags.parameters.length, body.indexOf(tags.source)-1);
        } else if (body.indexOf(tags.example) != -1) {
            description.parameters = body.substring(body.indexOf(tags.parameters)+tags.parameters.length, body.indexOf(tags.example)-1);
        } else if (body.indexOf(tags.changelog) != -1) {
            description.parameters = body.substring(body.indexOf(tags.parameters)+tags.parameters.length, body.indexOf(tags.changelog)-1);
        } else if (body.indexOf(tags.seeAlso) != -1) {
            description.parameters = body.substring(body.indexOf(tags.parameters)+tags.parameters.length, body.indexOf(tags.seeAlso)-1);
        } else if (body.indexOf(tags.footer) != -1) {
            description.parameters = body.substring(body.indexOf(tags.parameters)+tags.parameters.length, body.indexOf(tags.footer)-1);
        }
        if (description.parameters.length > 1023) {
            description.parameters = description.parameters.substring(0, 2040)+"..."
        }
    } else {
        description.parameters = ("Not found!");
    }
    if (body.indexOf(tags.source) != -1) {
        if (body.indexOf(tags.example) != -1) {
            description.source = body.substring(body.indexOf(tags.source)+tags.source.length, body.indexOf(tags.example)-1);
        } else if (body.indexOf(tags.changelog) != -1) {
            description.source = body.substring(body.indexOf(tags.source)+tags.source.length, body.indexOf(tags.changelog)-1);
        } else if (body.indexOf(tags.seeAlso) != -1) {
            description.source = body.substring(body.indexOf(tags.source)+tags.source.length, body.indexOf(tags.seeAlso)-1);
        } else if (body.indexOf(tags.footer) != -1) {
            description.source = body.substring(body.indexOf(tags.source)+tags.source.length, body.indexOf(tags.footer)-1);
        }
        if (description.source.length > 1023) {
            description.source = description.source.substring(0, 2040)+"..."
        }
    } else {
        description.source = ("Not found!");
    }
    if (body.indexOf(tags.example) != -1) {
        if (body.indexOf(tags.changelog) != -1) {
            description.example = body.substring(body.indexOf(tags.example)+tags.example.length, body.indexOf(tags.changelog)-1);
        } else if (body.indexOf(tags.seeAlso) != -1) {
            description.example = body.substring(body.indexOf(tags.example)+tags.example.length, body.indexOf(tags.seeAlso)-1);
        } else if (body.indexOf(tags.footer) != -1) {
            description.example = body.substring(body.indexOf(tags.example)+tags.example.length, body.indexOf(tags.footer)-1);
        }
        if (description.example.length > 1023) {
            description.example = description.example.substring(0, 2040)+"..."
        }
    } else {
        description.example = ("Not found!");
    }
    if (body.indexOf(tags.changelog) != -1) {
        if (body.indexOf(tags.seeAlso) != -1) {
            description.changelog = body.substring(body.indexOf(tags.changelog)+tags.changelog.length, body.indexOf(tags.seeAlso)-1);
        } else if (body.indexOf(tags.footer) != -1) {
            description.changelog = body.substring(body.indexOf(tags.changelog)+tags.changelog.length, body.indexOf(tags.footer)-1);
        }
        if (description.changelog.length > 1023) {
            description.changelog = description.changelog.substring(0, 2040)+"..."
        }
    } else {
        description.changelog = ("Not found!");
    }
    if (body.indexOf(tags.seeAlso) != -1) {
        if (body.indexOf(tags.footer) != -1) {
            description.seeAlso = "**See Also**"+body.substring(body.indexOf(tags.seeAlso)+tags.seeAlso.length, body.indexOf(tags.footer)-1);
        }
        if (description.seeAlso.length > 1023) {
            description.seeAlso = description.seeAlso.substring(0, 2040)+"..."
        }
    } else {
        description.seeAlso = ("Not found!");
    }
    return description;
}

function processWikiData(body, title, message, part, inline) {
    var blocked = ["[[{{{image}}}|link=]]"]
    for (var i = 0, len = blocked.length; i < len; i++) {
        body = body.replace(blocked[i], "")
    }
    body = body.replace(/\n\s*\n/g, '\n');
    body = body.replace("Click to collapse [-]Client", "__Client__")
    body = body.replace("Click to collapse [-]Server", "__Server__")
    let type = body.substring(body.indexOf(tags.beforeTitle)+tags.beforeTitle.length, body.indexOf(tags.afterTitle)-1);
    let types = type.split("\",\"");
    if (determineType(types) == "SharedFunction") {
        let description = processFunction(body);
        let embed = new RichEmbed();
        embed.setTitle("**"+title+"**")
        embed.setAuthor('Shared Function', null, 'https://wiki.multitheftauto.com/wiki/Shared_Scripting_Functions')
        embed.setFooter("@"+message.author.tag, message.author.avatarURL)
        if (!inline  && message.channel.type == "text") {
            message.delete()
        }
        console.log(part)
        if (part) {
            if (part == "description") {
                embed.addField("Description:", description.description.substring(0, 1020)+"...")
            } else if (part == "syntax") {
                embed.addField("Syntax:", description.syntax.substring(0, 1020)+"...")
            } else if (part == "oop") {
                embed.addField("oop:", description.oop.substring(0, 1020)+"...")
            } else if (part == "args") {
                embed.addField("Arguements:", description.reqArgs.substring(0, 480)+"..."+"\n"+description.optArgs.substring(0, 480)+"...")
            } else if (part == "returns") {
                embed.addField("Returns:", description.returns.substring(0, 1020)+"...")
            } else if (part == "example") {
                embed.addField("Example:", description.example.substring(0, 1020)+"...")
            } else if (part == "changelog") {
                embed.addField("ChangeLog:", description.changelog.substring(0, 1020)+"...")
            } else if (part == "seealso") {
                embed.addField("SeeAlso:", description.seeAlso.substring(0, 1020)+"...")
            } else {
                embed.addField("Not found!")
            }
        } else {
            var noParts = description.description+"\n"+description.syntax
            if (noParts.length > 1023) {
                embed.addField("Description:", description.description.substring(0, 500)+"...")
                embed.addField("Syntax:", description.syntax.substring(0, 500)+"...")
            } else {
                embed.addField("Description:", description.description)
                embed.addField("Syntax:", description.syntax)
            }
        }
        embed.setURL("https://wiki.multitheftauto.com/wiki/"+fixUpperCase(title))
        embed.setColor("BLUE")
        message.channel.send(embed);
    } else if (determineType(types) == "ServerFunction") {
        let description = processFunction(body);
        let embed = new RichEmbed();
        embed.setTitle("**"+title+"**")
        embed.setAuthor('Server Function', null, 'https://wiki.multitheftauto.com/wiki/Server_Scripting_Functions')
        embed.setFooter("@"+message.author.tag, message.author.avatarURL)
        if (!inline  && message.channel.type == "text") {
            message.delete()
        }
        if (part) {
            if (part == "description") {
                embed.addField("Description:", description.description.substring(0, 1020)+"...")
            } else if (part == "syntax") {
                embed.addField("Syntax:", description.syntax.substring(0, 1020)+"...")
            } else if (part == "oop") {
                embed.addField("oop:", description.oop.substring(0, 1020)+"...")
            } else if (part == "args") {
                embed.addField("Arguements:", description.reqArgs.substring(0, 480)+"..."+"\n"+description.optArgs.substring(0, 480)+"...")
            } else if (part == "returns") {
                embed.addField("Returns:", description.returns.substring(0, 1020)+"...")
            } else if (part == "example") {
                embed.addField("Example:", description.example.substring(0, 1020)+"...")
            } else if (part == "changelog") {
                embed.addField("ChangeLog:", description.changelog.substring(0, 1020)+"...")
            } else if (part == "seealso") {
                embed.addField("SeeAlso:", description.seeAlso.substring(0, 1020)+"...")
            } else {
                embed.addField("Not found!")
            }
        } else {
            var noParts = description.description+"\n"+description.syntax
            if (noParts.length > 1023) {
                embed.addField("Description:", description.description.substring(0, 1020)+"...")
                embed.addField("Syntax:", description.syntax.substring(0, 1020)+"...")
            } else {
                embed.addField("Description:", description.description)
                embed.addField("Syntax:", description.syntax)
            }
        }
        embed.setURL("https://wiki.multitheftauto.com/wiki/"+fixUpperCase(title))
        embed.setColor("ORANGE")
        message.channel.send(embed);
    } else if (determineType(types) == "ClientFunction") {
        let description = processFunction(body);
        let embed = new RichEmbed();
        embed.setTitle("**"+title+"**")
        embed.setAuthor('Client Function', null, 'https://wiki.multitheftauto.com/wiki/Client_Scripting_Functions')
        embed.setFooter("@"+message.author.tag, message.author.avatarURL)
        if (!inline  && message.channel.type == "text") {
            message.delete()
        }
        if (part) {
            if (part == "description") {
                embed.addField("Description:", description.description.substring(0, 1020)+"...")
            } else if (part == "syntax") {
                embed.addField("Syntax:", description.syntax.substring(0, 1020)+"...")
            } else if (part == "oop") {
                embed.addField("oop:", description.oop.substring(0, 1020)+"...")
            } else if (part == "args") {
                embed.addField("Arguements:", description.reqArgs.substring(0, 1020)+"..."+"\n"+description.optArgs.substring(0, 1020)+"...")
            } else if (part == "returns") {
                embed.addField("Returns:", description.returns.substring(0, 1020)+"...")
            } else if (part == "example") {
                embed.addField("Example:", description.example.substring(0, 1020)+"...")
            } else if (part == "changelog") {
                embed.addField("ChangeLog:", description.changelog.substring(0, 1020)+"...")
            } else if (part == "seealso") {
                embed.addField("SeeAlso:", description.seeAlso.substring(0, 1020)+"...")
            } else {
                embed.addField("Not found!")
            }
        } else {
            var noParts = description.description+"\n"+description.syntax
            if (noParts.length > 1023) {
                embed.addField("Description:", description.description.substring(0, 1020)+"...")
                embed.addField("Syntax:", description.syntax.substring(0, 1020)+"...")
            } else {
                embed.addField("Description:", description.description)
                embed.addField("Syntax:", description.syntax)
            }
        }
        embed.setURL("https://wiki.multitheftauto.com/wiki/"+fixUpperCase(title))
        embed.setColor("ORANGE")
        message.channel.send(embed);
     } else if (determineType(types) == "UsefulFunction") {
        let description = processFunction(body);
        let embed = new RichEmbed();
        embed.setTitle("**"+title+"**")
        embed.setAuthor('Useful Function', null, 'https://wiki.multitheftauto.com/wiki/Useful_Scripting_Functions')
        embed.setFooter("@"+message.author.tag, message.author.avatarURL)
        if (!inline  && message.channel.type == "text") {
            message.delete()
        }
        if (part) {
            if (part == "description") {
                embed.addField("Description:", description.description.substring(0, 1020)+"...")
            } else if (part == "syntax") {
                embed.addField("Syntax:", description.syntax.substring(0, 1020)+"...")
            } else if (part == "oop") {
                embed.addField("oop:", description.oop.substring(0, 1020)+"...")
            } else if (part == "args") {
                embed.addField("Arguements:", description.reqArgs.substring(0, 480)+"..."+"\n"+description.optArgs.substring(0, 480)+"...")
            } else if (part == "returns") {
                embed.addField("Returns:", description.returns.substring(0, 1020)+"...")
            } else if (part == "example") {
                embed.addField("Example:", description.example.substring(0, 1020)+"...")
            } else if (part == "changelog") {
                embed.addField("ChangeLog:", description.changelog.substring(0, 1020)+"...")
            } else if (part == "seealso") {
                embed.addField("SeeAlso:", description.seeAlso.substring(0, 1020)+"...")
            } else {
                embed.addField("Not found!")
            }
        } else {
            var noParts = description.description+"\n"+description.syntax
            if (noParts.length > 1023) {
                embed.addField("Description:", description.description.substring(0, 1020)+"...")
                embed.addField("Syntax:", description.syntax.substring(0, 1020)+"...")
            } else {
                embed.addField("Description:", description.description)
                embed.addField("Syntax:", description.syntax)
            }
        }
        embed.setURL("https://wiki.multitheftauto.com/wiki/"+fixUpperCase(title))
        embed.setColor("GREEN")
        message.channel.send(embed);
    } else if (determineType(types) == "ServerEvent") {
        let description = processEvent(body);
        let embed = new RichEmbed();
        embed.setTitle("**"+title+"**")
        embed.setAuthor('Server Event', null, 'https://wiki.multitheftauto.com/wiki/Server_Scripting_Events')
        embed.setFooter("@"+message.author.tag, message.author.avatarURL)
        if (!inline  && message.channel.type == "text") {
            message.delete()
        }
        if (part) {
            if (part == "description") {
                embed.addField("Description:", description.description.substring(0, 1020)+"...")
            } else if (part == "parameters") {
                embed.addField("Parameters:", description.parameters.substring(0, 1020)+"...")
            } else if (part == "source") {
                embed.addField("Source:", description.source.substring(0, 1020)+"...")
            } else if (part == "example") {
                embed.addField("Example:", description.example.substring(0, 1020)+"...")
            } else if (part == "changelog") {
                embed.addField("ChangeLog:", description.changelog.substring(0, 1020)+"...")
            } else if (part == "seealso") {
                embed.addField("SeeAlso:", description.seeAlso.substring(0, 1020)+"...")
            } else {
                embed.addField("Not found!")
            }
        } else {
            var noParts = description.description+"\n"+description.parameters+"\n"+description.source
            if (noParts.length > 1023) {
                embed.addField("Description:", description.description.substring(0, 1020)+"...")
                embed.addField("Parameters:", description.parameters.substring(0, 1020)+"...")
                embed.addField("Source:", description.source.substring(0, 1020)+"...")
            } else {
                embed.addField("Description:", description.description)
                embed.addField("Parameters:", description.parameters)
                embed.addField("Source:", description.source)
            }
        }
        embed.setURL("https://wiki.multitheftauto.com/wiki/"+fixUpperCase(title))
        embed.setColor("ORANGE")
        message.channel.send(embed);
    } else if (determineType(types) == "ClientEvent") {
        let description = processEvent(body);
        let embed = new RichEmbed();
        embed.setTitle("**"+title+"**")
        embed.setAuthor('Client Event', null, 'https://wiki.multitheftauto.com/wiki/Client_Scripting_Events')
        embed.setFooter("@"+message.author.tag, message.author.avatarURL)
        if (!inline  && message.channel.type == "text") {
            message.delete()
        }
        if (part) {
            if (part == "description") {
                embed.addField("Description:", description.description.substring(0, 1020)+"...")
            } else if (part == "parameters") {
                embed.addField("Parameters:", description.parameters.substring(0, 1020)+"...")
            } else if (part == "source") {
                embed.addField("Source:", description.source.substring(0, 1020)+"...")
            } else if (part == "example") {
                embed.addField("Example:", description.example.substring(0, 1020)+"...")
            } else if (part == "changelog") {
                embed.addField("ChangeLog:", description.changelog.substring(0, 1020)+"...")
            } else if (part == "seealso") {
                embed.addField("SeeAlso:", description.seeAlso.substring(0, 1020)+"...")
            } else {
                embed.addField("Not found!")
            }
        } else {
            var noParts = description.description+"\n"+description.parameters+"\n"+description.source
            if (noParts.length > 1023) {
                embed.addField("Description:", description.description.substring(0, 1020)+"...")
                embed.addField("Parameters:", description.parameters.substring(0, 1020)+"...")
                embed.addField("Source:", description.source.substring(0, 1020)+"...")
            } else {
                embed.addField("Description:", description.description)
                embed.addField("Parameters:", description.parameters)
                embed.addField("Source:", description.source)
            }
        }
        embed.setURL("https://wiki.multitheftauto.com/wiki/"+fixUpperCase(title))
        embed.setColor("ORANGE")
        message.channel.send(embed);
    } else {
        let embed = new RichEmbed();
        embed.addField("404 not found", "No match found!")
        embed.setThumbnail("https://cdn.discordapp.com/attachments/490158605681688602/575364058031718467/103085.png")
        embed.setFooter("For more information use: "+prefix+"wiki usage")
        embed.setURL("https://wiki.multitheftauto.com/wiki"+fixUpperCase(title))
        embed.setColor("RED")
        message.channel.send(embed);
    }
    
}

client.login("TOKEN_HERE");
