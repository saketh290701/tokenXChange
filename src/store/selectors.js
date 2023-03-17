import {createSelector} from "reselect";
import {get, groupBy, reject, minBy, maxBy} from 'lodash'
import {ethers} from "ethers";
import moment from "moment";

const GREEN = '#25CE8F'
const RED = '#F45353'
const tokens = state => get(state, 'tokens.contracts')
const account = state => get(state, 'provider.account')
const events = state => get(state, 'exchange.events')

const allOrders = state => get(state, 'exchange.allOrders.data', [])
const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
const filledOrders = state => get(state, 'exchange.filledOrders.data', [])

const decorateOrder = (order, tokens) => {

    let token0Amount, token1Amount

    // Note:DApp should be considered token0, mETH is considered token1
    // Example: Giving mETH in exchange for DApp
    if (order.tokenGive === tokens[1].address) {
        token0Amount = order.amountGive // amount of DApp we are giving
        token1Amount = order.amountGet // amount of mETH we want...
    } else {
        token0Amount = order.amountGet // amount of DApp we want
        token1Amount = order.amountGive // amount of mETH we are giving
    }

    const precision = 100000
    let tokenPrice = (token1Amount / token0Amount)
    tokenPrice = Math.round(tokenPrice * precision) / precision

    return ({
        ...order,
        token0Amount: ethers.utils.formatUnits(token0Amount, 'ether'),
        token1Amount: ethers.utils.formatUnits(token1Amount, 'ether'),
        tokenPrice,
        formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ssa d MMM D')

    })
}

const openOrders = (state) => {

    const all = allOrders(state)
    const cancelled = cancelledOrders(state)
    const filled = filledOrders(state)


    const openOrders = reject(all, (order) => {
        const orderFilled = filled.some((o) => o.id.toString() === order.id.toString())
        const orderCancelled = cancelled.some((o) => o.id.toString() === order.id.toString())

        return (orderFilled || orderCancelled)
    })

    return openOrders;

}

////=----------------
// My events
export const myEventsSelector = createSelector(
    events,
    account,
    (events, account) =>{

        events.filter((e) => e.args.user === account)

        console.log(events)

        return events;
    }
)

// Order BOOK
export const orderBookSelector = createSelector(
    openOrders,
    tokens,
    (orders, tokens) => {

        if (!tokens[0] || !tokens[1]) {
            return;
        }

        // filter orders by selected tokens
        orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)


        // decorate orders
        orders = decorateOrderBookOrders(orders, tokens)

        // group order
        orders = groupBy(orders, 'orderType')

        // sort buy orders by tokens price
        const buyOrders = get(orders, 'buy', [])
        orders = {
            ...orders,
            buyOrders: buyOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
        }


        // sort sell orders by tokens price
        const sellOrders = get(orders, 'sell', [])
        orders = {
            ...orders,
            sellOrders: sellOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
        }

        return orders;
    }
)


// ALL Filled Orders
export const filledOrdersSelector = createSelector(
    filledOrders,
    tokens,
    (orders, tokens) => {

        if (!tokens[0] || !tokens[1]) {
            return;
        }

        // filter orders by selected tokens
        orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)


        // Sort orders by date ascending to price comparison
        orders = orders.sort((a, b) => a.timestamp - b.timestamp)

        // decorate the orders
        orders = decorateFilledOrders(orders, tokens)

        orders = orders.sort((a, b) => b.timestamp - a.timestamp)

        return orders;

    }
)


// my open orders
export const myOpenOrdersSelector = createSelector(
    account,
    tokens,
    openOrders,
    (account, tokens, orders) => {

        if (!tokens[0] || !tokens[1]) {
            return;
        }

        orders = orders.filter((o) => o.user === account)

        // filter orders by selected tokens
        orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)

        // decorate the orders
        orders = decorateMyOpenOrders(orders, tokens)

        orders = orders.sort((a, b) => b.timestamp - a.timestamp)

        return orders;

    }
)
const decorateMyOpenOrders = (orders, tokens) => {

    return orders.map((order) => {
        order = decorateOrder(order, tokens)
        order = decorateMyOpenOrder(order, tokens)

        return order
    })
}

const decorateMyOpenOrder = (order, tokens) => {
    let orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell'

    return({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN : RED)
    })
}



// my Filled orders
export const myFilledOrdersSelector = createSelector(
    account,
    tokens,
    filledOrders,
    (account, tokens, orders) => {

        if (!tokens[0] || !tokens[1]) {
            return;
        }

        orders = orders.filter((o) => o.user === account || o.creator === account)

        // filter orders by selected tokens
        orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)

        // order by ascending
        orders = orders.sort((a, b) => b.timestamp - a.timestamp)

        // decorate the orders
        orders = decorateMyFilledOrders(orders,account, tokens)

        return orders;

    }
)
const decorateMyFilledOrders = (orders,account, tokens) => {

    return orders.map((order) => {
        order = decorateOrder(order, tokens)
        order = decorateMyFilledOrder(order, account, tokens)

        return order
    })
}

const decorateMyFilledOrder = (order, account, tokens) => {

    const myOrder = order.creator === account

    let orderType

    if(myOrder){
        orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell'
    }else{
        orderType = order.tokenGive === tokens[1].address ? 'sell' : 'buy'
    }

    return({
        ...order,
        orderType,
        orderClass: (orderType === 'buy' ? GREEN : RED),
        orderSign: (orderType === 'buy' ? '+' : '-')
    })
}


const decorateFilledOrders = (orders, tokens) => {

    let previousOrder = orders[0]

    return orders.map((order) => {
        order = decorateOrder(order, tokens)
        order = decorateFilledOrder(order, previousOrder)

        previousOrder = order // update the previous order once it's decorated

        return order
    })

}
const decorateFilledOrder = (order, previousOrder) => {

    return ({
        ...order,
        tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder),
    })
}

const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {
    // apply order colors

    if (previousOrder.id === orderId) {
        return GREEN
    }

    if (previousOrder.tokenPrice <= tokenPrice) {
        return GREEN;
    } else {
        return RED;
    }
}


const decorateOrderBookOrders = (orders, tokens) => {

    return (
        orders.map((order) => {
            order = decorateOrder(order, tokens)
            order = decorateOrderBookOrder(order, tokens)

            return (order)
        })
    )
}
const decorateOrderBookOrder = (order, tokens) => {
    const orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell'

    return ({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN : RED),
        orderFillAction: (orderType === 'buy' ? 'sell' : 'buy'),
    })
}


//////////////////////////////////////////////
// Price Cart

export const priceChartSelector = createSelector(
    filledOrders,
    tokens,
    (orders, tokens) => {
        if (!tokens[0] || !tokens[1]) {
            return;
        }


        // filter orders by selected tokens
        orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)


        // Sort orders by date ascending to compare history
        orders = orders.sort((a, b) => a.timestamp - b.timestamp)

        // decorate orders
        orders = decorateOrderBookOrders(orders, tokens)


        let secondLastOrder, lastOrder
        [secondLastOrder, lastOrder] = orders.slice(orders.length - 2, orders.length)

        const lastPrice = get(lastOrder, 'tokenPrice', 0)


        const secondLastPrice = get(secondLastOrder, 'tokenPrice', 0)

        const series = {
            lastPrice,
            lastPriceChange: (lastPrice >= secondLastPrice ? '+' : '-'),
            series: [{
                data: buildGraphData(orders)

            }]
        }

        return (series);


    }
)

const buildGraphData = (orders) => {
    // group order
    orders = groupBy(orders, (o) => moment.unix(o.timestamp).startOf('hour').format())

    const hours = Object.keys(orders)

    let data = hours.map((hour) => {

        // fetch all orders form current hrs
        const group = orders[hour]

        console.log(orders)
        // calculate prices open, high low, close
        const open = group[0]
        const high = maxBy(group, 'tokenPrice')
        const low = minBy(group, 'tokenPrice')
        const close = group[group.length - 1]


        return ({
            x: new Date(hour),
            y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice]
        })
    })

    return data;
}