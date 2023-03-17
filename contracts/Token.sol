// SPDX-License-Identifier: GPL
pragma solidity ^0.8.17;

import "hardhat/console.sol";

contract Token {

    string public name;

    string public symbol;

    uint public decimals = 18;

    uint public totalSupply = 1000000 * (10**decimals);

    mapping(address => uint) public balanceOf;

    mapping(address => mapping(address => uint)) public allowance;

    event Transfer(
        address indexed from,
        address indexed to,
        uint value
    );

    event Approval(
        address indexed owner,
        address indexed spender,
        uint value
    );

    constructor(string memory _name, string memory _symbol){
        name = _name;
        symbol = _symbol;

        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint _amount) public returns(bool success){
        // require that sender has enough tokens to spend
        require(balanceOf[msg.sender] >= _amount);

        _transfer(msg.sender, _to, _amount);

        return true;

    }

    function _transfer(address _from, address _to, uint _value) internal{

        // reject invalid
        require(_to != address(0));

        // deduct token from sender
        balanceOf[_from] = balanceOf[_from] - _value;
        // create tokens to receiver
        balanceOf[_to] = balanceOf[_to] + _value;

        emit Transfer(_from, _to, _value);
    }

    function approve(address _spender, uint _value) public returns(bool success){
        // reject invalid
        require(_spender != address(0));

        allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint _value) public returns(bool success){

//        console.log(_from, _to, _value);
        require(_value <= balanceOf[_from], 'insufficient bal');
        require(_value <= allowance[_from][msg.sender], 'insufficient allow');

        // reset allowance
        allowance[_from][msg.sender] = allowance[_from][msg.sender] - _value;

        _transfer(_from, _to, _value);

        return true;
    }





}
