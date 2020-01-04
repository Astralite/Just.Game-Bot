# Just.Game Bot
This is a localhost node bot "miner" for Just.Game. By default it
doesn't upgradeTickets. Mostly it monitors game state and each defined action
can be used as an action point for gameplay logic.

````
1578171099 WITNESSED_TRX_PURCHASE_VALUE 141205872511
1578171159 STALKED_VALUE_10 0.012
1578171160 ACCOUNT_LIST_POSITION 173
1578171161 REFRESH_PLAYER_DEPTH 3033
1578171169 ADD_PLAYER 41e58b0be92b203566921404590663e3cb84d78713
1578172601 REFRESH_PLAYER_DEPTH 3036
1578172620 ACCOUNT_LIST_POSITION 188
1578172631 REFRESH_PLAYER_DEPTH 3036
1578172640 ACCOUNT_LIST_POSITION 188
````

Do not use a core address for this bot. Use a different account and send
it TRX to work for you. Don't trust anyone's random software with private keys.

If you want to receive email alerts for Just.Game timer status I created a service for that purpose.

## [CurvyAlerts](https://curvyalerts.com)
A site which sends emails accounts based off Just.Game Timer Status. Make a throw away gmail account for the service. Then have gmail forward text emails
containing CurvyAlerts to your mobile providers text to SMS gateway.

## Support [Just.Game](https://curvy.ai/andrewyang) Bot Development

This bot does not intend to create winning strategies but its free just use my [ref link](https://curvy.ai/andrewyang). It only intends to give
users predefined places for actionable code based on event status or local
database queries. Do as you wish.

By default this bot will do a few simple items
1) purchase if under 30 seconds and not on the timer list

````javascript
/* under 30 seconds & not on list, bid */
if(+myPosition.toNumber() > 100 && offset < 30) {
...
}
````

2) upgrade tickets based on  "shouldUpgradeTickets": false status in
config/config.json, turn to true to allow ticket upgrades

3) upgrade attempts will occur after glitch takes place and based upon event or database info

#### Will this win money?

This is mostly brute force. Realistically, you need a Tron fullNode to be competitive. However, some strategies could be competitive regardless of node usage. Trongrid is likely throttling your API requests when you see.

````
Error: connect ETIMEDOUT 11.22.333.xxx:443
````

#### Upgrading tickets
Executing Upgrade on tickets grants the calling wallet 1% of the mined value. If the account upgrade is work 10,000 trx. You get 100 trx in value for calling the method.


#### Prerequisites
* node 8.x

#### Instructions

* git clone git clone https://github.com/tkntobfrk/JustGameMiner.git
* cd JustGameMiner
* cp config/config.example config/config.json
* input account + privatekey in config/config.json
* optional (set "shouldUpgradeTickets": true) to force bot to bid
* npm i
* npm start


#### Value Estimation/Methods
The value estimates and USD conversion aand no promises to
the accuracy of data. Should be more targeted and native to TRX itself to find
if accounts are breakeven.

#### Glitch Assumption

I made the assumption that bombcounter increments during the round and corrolates to Glitch firing. I'm not 100% certain that is correct.
