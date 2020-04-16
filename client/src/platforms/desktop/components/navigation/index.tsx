// Library Imports
import React, { Component } from "react";
import { connect } from "react-redux";

// Relative Imports
import {
  Container,
  Haven,
  Logo,
  Brand,
  Button,
  Logout,
  Tag,
  Dropdown,
  State,
  Wrapper,
  Network,
  Row,
  NetworkStatus
} from "./styles";
import Icon from "assets/haven.svg";
import { closeWallet } from "../../actions";
import { selectIsLoggedIn } from "../../reducers/walletSession";
import { NET_TYPE_NAME } from "constants/env";
import { DesktopAppState } from "../../reducers";
import { DaemonStates } from "../../reducers/daemonStates";
import Arrow from "../../../../assets/icons/chevron.js";

interface NavigationProps {
  daemonStates: DaemonStates;
  isLoggedIn: boolean;
  show_networks: boolean;
  logout: () => void;
}

class Navigation extends Component<NavigationProps, any> {
  state = {
    show_networks: false,
    current_network: "Stagenet"
  };

  onComponentDidMount() {
    this.setState({
      current_network: NET_TYPE_NAME
    });
  }

  handleLogout = () => {
    this.props.logout();
  };

  showNetworks = () => {
    this.setState({
      show_networks: !this.state.show_networks
    });
  };

  currentNetwork = (network: any) => {
    this.setState({
      current_network: network
    });
    alert("LOGOUT AND CHANGE NETWORK");
  };

  render() {
    const auth = this.props.isLoggedIn;
    const { node, wallet } = this.props.daemonStates;
    const { show_networks, current_network } = this.state;
    console.log("daemonStates", this.props.daemonStates);

    return (
      <Container>
        <Brand to={auth === true ? "/wallet/assets" : "/"}>
          <Logo src={Icon} />
          <Haven>HAVEN</Haven>

          <NetworkStatus>
            <Wrapper onClick={this.showNetworks} show_networks={show_networks}>
              <Row>
                <Tag>{current_network}</Tag>
                <Dropdown show_networks={show_networks ? true : false}>
                  <Arrow color="#000" />
                </Dropdown>
              </Row>
              {show_networks && (
                <Network>
                  <Tag onClick={() => this.currentNetwork("Mainnet")}>
                    Mainnet
                  </Tag>
                  <Tag onClick={() => this.currentNetwork("Stagenet")}>
                    Stagenet
                  </Tag>
                  <Tag onClick={() => this.currentNetwork("Testnet")}>
                    Testnet
                  </Tag>
                </Network>
              )}
            </Wrapper>
            {!wallet.isRunning && (
              <State isActive={wallet.isRunning}>Wallet Offline</State>
            )}
            {!node.isRunning && (
              <State isActive={node.isRunning}>Node Offline</State>
            )}
          </NetworkStatus>
        </Brand>
        {auth === false ? (
          <Button to="/">Login</Button>
        ) : (
          <Logout onClick={this.handleLogout}>Logout</Logout>
        )}
      </Container>
    );
  }
}

const mapStateToProps = (state: DesktopAppState) => ({
  isLoggedIn: selectIsLoggedIn(state),
  daemonStates: state.daemonStates
});

export const NavigationDesktop = connect(
  mapStateToProps,
  { logout: closeWallet }
)(Navigation);
