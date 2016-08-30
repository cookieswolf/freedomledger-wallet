import React from "react";
import ReactDOM from "react-dom";
import Immutable from "immutable";
import DashboardList from "./DashboardList";
import RecentTransactions from "../Account/RecentTransactions";
import Translate from "react-translate-component";
import ps from "perfect-scrollbar";
import AssetName from "../Utility/AssetName";
import assetUtils from "common/asset_utils";
import MarketCard from "./MarketCard";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";

class Dashboard extends React.Component {


    constructor() {
        super();
        this.state = {
            width: null,
            height: null,
            showIgnored: false,
            removeBackupWarning: SettingsStore.getState().settings.get("removeBackupWarning", false)
        };

        this._setDimensions = this._setDimensions.bind(this);
    }

    componentDidMount() {
        // let c = ReactDOM.findDOMNode(this.refs.container);
        // ps.initialize(c);

        this._setDimensions();

        window.addEventListener("resize", this._setDimensions, false);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.linkedAccounts !== this.props.linkedAccounts ||
            nextProps.ignoredAccounts !== this.props.ignoredAccounts ||
            nextState.width !== this.state.width ||
            nextState.height !== this.state.height ||
            nextState.showIgnored !== this.state.showIgnored
        );
    }

    // componentDidUpdate() {
    //     let c = ReactDOM.findDOMNode(this.refs.container);
    //     ps.update(c);
    // }

    componentWillUnmount() {
        window.removeEventListener("resize", this._setDimensions, false);
    }

    _setDimensions() {
        let width = window.innerWidth;
        let height = this.refs.wrapper.offsetHeight;

        if (width !== this.state.width || height !== this.state.height) {
            this.setState({width, height});
        }
    }

    _onToggleIgnored() {
        this.setState({
            showIgnored: !this.state.showIgnored
        });
    }

    _onCloseWarning() {
        let newVal = !this.state.removeBackupWarning
        this.setState({
            removeBackupWarning: newVal
        });
        SettingsActions.changeSetting({setting: "removeBackupWarning", value: newVal });
        this.forceUpdate(); // Not sure why this is needed
    }

    render() {
        let {linkedAccounts, myIgnoredAccounts} = this.props;
        let {width, height, showIgnored} = this.state;

        let names = linkedAccounts.toArray().sort();
        let ignored = myIgnoredAccounts.toArray().sort();

        let accountCount = linkedAccounts.size + myIgnoredAccounts.size;

        let featuredMarkets = [
            ["OPEN.BTC", "PEERPLAYS"],
            ["USD"     , "PEERPLAYS"],
            ["BTS"     , "PEERPLAYS"],
            ["OPEN.ETH", "PEERPLAYS"],
            ["OPEN.BTC", "MKR"],
            ["OPEN.BTC", "OPEN.DGD"],
            ["OPEN.BTC", "OPEN.STEEM"],
            ["BTS", "USD"],
            ["BTC", "BTS", false],
            ["BTS", "GOLD"],
            ["OPEN.BTC", "OPEN.ETH"],
        ];

        let newAssets = [
            "PEERPLAYS",
        ];

        let markets = featuredMarkets.map((pair, index) => {

            let className = "";
            if (index > 3) {
                className += "show-for-medium";
            }
            if (index > 8) {
                className += " show-for-large";
            }

            return (
                <MarketCard
                    key={pair[0] + "_" + pair[1]}
                    new={newAssets.indexOf(pair[1]) !== -1}
                    className={className}
                    quote={pair[0]}
                    base={pair[1]}
                    invert={pair[2]}
                />
            );
        });

        let warning = (!this.state.removeBackupWarning) ?
                <div className="grid-container">
                    <div className="grid-block no-overflow">
                        <div className="callout warning">
                          <h5>Backup required!</h5>
                          <p>Freedomledger is built on a decentralized blockchain. This means your funds are
                          <strong> 100% in your control at all times</strong>. Unlike other cryptocurrency exchanges, we
                          do not store your account information on our server. The private keys to your account are
                          <strong> stored in your web
                          browser</strong>. If you do not have an account backup, you will lose your funds permanently
                          when you delete your browser cache or format your hard drive. Freedom ledger cannot restore
                          lost funds. You must backup your own account.</p>

                          <a className={"button success"} href="#/wallet/backup/create">Create a backup now</a>
                          <a className={"button success"} href="#/wallet/backup/restore">Restore a backup</a>
                          <button className={"button outline"} type="button"
                                  onClick={this._onCloseWarning.bind(this)}>
                                  Understood!
                          </button>
                        </div>
                    </div>
                </div>
               : null;

        return (
            <div ref="wrapper" className="grid-block page-layout vertical">
                {warning}
                <div ref="container" className="grid-container" style={{padding: "25px 10px 0 10px"}}>
                    <Translate content="exchange.featured" component="h4" />
                    <div className="grid-block small-up-1 medium-up-3 large-up-4 no-overflow">
                        {markets}
                    </div>

                    {accountCount ? <div className="generic-bordered-box" style={{marginBottom: 5}}>
                        <div className="block-content-header" style={{marginBottom: 15}}>
                            <Translate content="account.accounts" />
                        </div>
                        <div className="box-content">
                            <DashboardList accounts={Immutable.List(names)} width={width} />
                            {myIgnoredAccounts.size ?
                                <table className="table table-hover" style={{fontSize: "0.85rem"}}>
                                    <tbody>
                                        <tr>
                                            <td colSpan={width < 750 ? "3" : "4"} style={{textAlign: "right"}}>
                                                <div onClick={this._onToggleIgnored.bind(this)}className="button outline">
                                                    <Translate content={`account.${ showIgnored ? "hide_ignored" : "show_ignored" }`} />
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table> : null}
                            {showIgnored ? <DashboardList compact accounts={Immutable.List(ignored)} width={width} /> : null}
                        </div>
                    </div> : null}

                    {accountCount ? <RecentTransactions
                        style={{marginBottom: 20, marginTop: 20}}
                        accountsList={this.props.linkedAccounts}
                        limit={10}
                        compactView={false}
                        fullHeight={true}
                        showFilters={true}
                    /> : null}

                </div>
            </div>);
    }
}

export default Dashboard;
