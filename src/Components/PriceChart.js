import {useSelector} from "react-redux";
import Banner from "./Banner";
import Chart from 'react-apexcharts';
import {options, series} from './PriceChart.config'
import {priceChartSelector} from "../store/selectors";
import downArrow from '../assets/down-arrow.svg'
import upArrow from '../assets/up-arrow.svg'
const PriceChart = () => {

    const account = useSelector(state => state.provider.account)
    const symbols = useSelector(state => state.tokens.symbols)

    const priceChart = useSelector(priceChartSelector)

    return (
        <div className="component exchange__chart">
            <div className='component__header flex-between'>
                <div className='flex'>

                    <h2>{symbols && `${symbols[0]}/${symbols[1]}`}</h2>

                    {priceChart && (
                        <div className='flex'>
                            {priceChart.lastPriceChange === '+' ? (
                                <img src={upArrow} alt="Arrow down" />
                            ):(
                                <img src={downArrow} alt="Arrow down" />
                            )}
                            <span className='up'>{priceChart && priceChart.lastPrice}</span>
                        </div>
                    )}


                </div>
            </div>

            {/* Price chart goes here */}
            {!account ? (
                <Banner text="Please connect with metamask"/>
            ) : (
                <Chart
                    type='candlestick'
                    options={options}
                    series={priceChart ? priceChart.series : series}
                    width='100%'
                    height='100%'
                />
            )}

        </div>
    );
}

export default PriceChart;