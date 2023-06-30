// SPDX-License-Identifier: MIT License
pragma solidity 0.8.18;

import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

/**
@title RobinHoo Coin

Based on Inedible Coin
https://www.inediblecoin.com/
0x3486b751a36f731a1bebff779374bad635864919

The difference is that RobinHoo **allows** sandwich attack BUT it tries to punish the bot - taking
a small fee from it's balance and giving it back to the victim.
In case it can't, sandwiching transactions will revert.
Note: it also handles the situation with multiple sandwiching transaction AND multiple attempts per block.
BOT : B
VICTIM : V
BUY/SELL : B/S

Simple case:
- B B
- V B
- B S

Multiple wraps:
- B1 B
- B2 B
- V B
- B2 S
- B1 S

Multiple attempts:
- B1 B
- V B
- B1 S
- B2 B
- V B
- B2 S
**/

contract RobinHoo is ERC20Votes {

    using EnumerableMap for EnumerableMap.AddressToUintMap;
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 constant PRECISION = 10**5;

    // Only privilege admin has is to add more dexes.
    // The centralization here shouldn't cause any problem.
    address public admin;
    address public pendingAdmin;
    uint256 public punishmentFee;

    // Dexes that you want to limit interaction with.
    mapping(address => uint256) private dexSwaps;
    // actor => amount
    EnumerableMap.AddressToUintMap private toDexTrades;
    EnumerableMap.AddressToUintMap private fromDexTrades;
    EnumerableSet.AddressSet private blockActors;

    constructor()
    ERC20("RobinHoo Coin", "ROBINHOO")
    ERC20Permit("RobinHoo Coin")
    {
        _mint(msg.sender, 888_888_888_888_888 ether);
        admin = msg.sender;
        punishmentFee = 1 * PRECISION;
    }
    modifier onlyAdmin {
        require(msg.sender == admin, "Only the administrator may call this function.");
        _;
    }

    /**
     * @dev On every 3rd trading transaction will check if there was an opposite 2nd tx (and 1st was the same direction)
     * and will try to forcibly take some amount back to the victim
     * @param _to Address that the funds are being sent to.
     * @param _from Address that the funds are being sent from.
     * @param _amount Trading amount
    **/
    function _beforeTokenTransfer(address _to, address _from, uint256 _amount)
    internal
    override
    {
        uint256 toSwap = dexSwaps[_to];
        uint256 fromSwap = dexSwaps[_from];

        if (toSwap < block.timestamp && fromSwap < block.timestamp) {   //clean up on new block
            address[] memory values = blockActors.values();
            for (uint256 i = 0; i < values.length; i++) {
                address _actor = blockActors.at(i);
                toDexTrades.remove(_actor);
                fromDexTrades.remove(_actor);
                blockActors.remove(_actor);
            }
        }

        if (toSwap > 0) {
            blockActors.add(_from);
            toDexTrades.set(_from, _amount);
            if (toSwap < block.timestamp) {             // No interactions have occurred this block.
                dexSwaps[_to] = block.timestamp;
            } else if (toSwap == block.timestamp) {     // 1 interaction has occurred this block.
                dexSwaps[_to] = block.timestamp + 1;
            } else {                                    // 3+
                _punishOrFail(_assertBot(fromDexTrades, _from), _from, _amount);
            }
        }

        if (fromSwap > 0) {
            blockActors.add(_to);
            fromDexTrades.set(_to, _amount);
            if (fromSwap < block.timestamp) {
                dexSwaps[_from] = block.timestamp;
            } else if (fromSwap == block.timestamp) {
                dexSwaps[_from] = block.timestamp + 1;
            } else {
                _punishOrFail(_assertBot(toDexTrades, _to), _to, _amount);
            }
        }
    }

    function _assertBot(EnumerableMap.AddressToUintMap storage _oppositeTrades, address _actor) internal view returns (address) {
        if (_oppositeTrades.contains(_actor)) {
            return blockActors.at(blockActors.length() - 1);    //last unique
        }
        return address(0);
    }

    function _punishOrFail(address _victim, address _badGuy, uint256 _amount)
    internal
    {
        if (_victim == address(0)) return;  //no one hurt for this 3+ tx
        if (_victim == _badGuy) return;     //opposite trades by same actor
        _transfer(_badGuy, _victim, _amount * punishmentFee / PRECISION / 100);

    }

    /**
     * @dev Turn a new dex address either on or off
     * @param _newDex The address of the dex.
    **/
    function toggleDex(address _newDex)
    external
    onlyAdmin
    {
        if (dexSwaps[_newDex] > 0) dexSwaps[_newDex] = 0;
        else dexSwaps[_newDex] = block.timestamp - 1;
    }

    /**
     * @dev How much of the bot's trade to take back
     * @param _newFee 1% = 1 * 10^5
    **/
    function setPunishmentFee(uint _newFee)
    external
    onlyAdmin
    {
        punishmentFee = _newFee;
    }

    /**
     * @dev Make a new admin pending. I hate 1-step ownership transfers. They terrify me.
     * @param _newAdmin The new address to transfer to.
    **/
    function transferAdmin(address _newAdmin)
    external
    onlyAdmin
    {
        pendingAdmin = _newAdmin;
    }

    /**
     * @dev Renounce admin if no one should have it anymore.
    **/
    function renounceAdmin()
    external
    onlyAdmin
    {
        admin = address(0);
    }

    /**
     * @dev Accept administrator from the pending address.
    **/
    function acceptAdmin()
    external
    {
        require(msg.sender == pendingAdmin, "Only the pending administrator may call this function.");
        admin = pendingAdmin;
        delete pendingAdmin;
    }

}
