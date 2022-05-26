/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/interface-name-prefix */
import React, { FC, useEffect, useState } from "react";
import { logger } from "./sdk";
import {Timeline, TimelineEvent} from 'react-event-timeline';
import axios from 'axios';
import { Channels } from "./channels";
import { Service } from "@wxcc-desktop/sdk-types";
import { Desktop } from "@wxcc-desktop/sdk";
interface IProps {
  isDarkMode: boolean;
}

const App: FC<IProps> = (props) => {

  const componentVersion = "2.1";
  const SERVICE_HOME = "check-readme-file";

  const [darkMode, setDarkMode] = useState(false);
  const [ani, setAni] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [assignedContacts, setAssignedContacts] = useState(
    [] as {
      interaction: Service.Aqm.Contact.Interaction;
    }[]
  );
  const [customerHistory, setCustomerHistory] = useState([{
    "id": "",
    "timestamp": "",
    "parent": "dummy",
    "level": 0,
    "channel": "",
    "source": "",
    "note": "",
    "link": ""
  }]);

  function getCustomerId(ani: string): void {
    let customerAni = ani;
    let mediaPrefix = "";
    if (ani.indexOf("@") === -1) {
      if (ani.length >= 15) {
        mediaPrefix = "psid";
      } else {
        mediaPrefix = "ani";
        if (ani.charAt(0) === '+') {
          customerAni = ani.substring(1);
        }
      }
    } else {
      mediaPrefix = "email";
    } 
    const url = `https://${SERVICE_HOME}/getuserdata?${mediaPrefix}=${customerAni}`;
    logger.debug(`URL for getCustomer: ${url}`);
    axios.get(url)
      .then((result) => {
        if(result){
          setCustomerId(result.data['username']);
        } else {
          logger.error(`There is no customer ID for ani: ${ani}`);
        }
      })
      .catch((err) => { 
        logger.error(err);
      });
  }

  function loadCustomerHistory(username: string): void{
    const url = `https://${SERVICE_HOME}/history?username=${username}`;
    logger.debug(`URL for loadCustomerHistory: ${url}`);
    axios.get(url)
      .then((result) => {
        if(result.data){
          setCustomerHistory(result.data);
        } else {
          logger.error(`There is no customer history for customer: ${username}`);
        }
      })
      .catch((err) => { 
        logger.error(err);
      });
  }

  async function getAssignedContacts() {
    const taskMap = await Desktop.actions.getTaskMap();
    
    const myAssignedContacts = Array.from(taskMap?.values() || []);
    setAssignedContacts(myAssignedContacts);
  }

  async function init() {
    await Desktop.config.init();
    getAssignedContacts();
  }

  useEffect(() => {
    logger.info(`Customer History component version: ${componentVersion}`)
    init();
  }, []);

  useEffect(() => {
    logger.debug(`isDarkMode=${props.isDarkMode}`);
    setDarkMode(props.isDarkMode);
  }, [props.isDarkMode]);

  useEffect(() => {
    if(ani){
      logger.debug(`ani=${ani}`);
      getCustomerId(ani);
    } 
  }, [ani]);

  useEffect(() => {
    if(customerId){
      loadCustomerHistory(customerId);
    }
  }, [customerId]);

  useEffect(() => {
    if(assignedContacts && 
      assignedContacts[0] && 
      assignedContacts[0].interaction &&
      assignedContacts[0].interaction.callAssociatedData &&
      assignedContacts[0].interaction.callAssociatedData.ani
      ){
      setAni(assignedContacts[0].interaction.callAssociatedData.ani.value);
    }
  }, [assignedContacts]);

  function eventTimestampToDateTime(timestamp: any): string {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dat = new Date(Date.parse(timestamp));
    return `${days[dat.getDay()]}, ${months[dat.getMonth()]} ${dat.getDate()} ${dat.getFullYear()} @ ${dat.toLocaleTimeString()}` 
  }

  function refreshHistory(): void{
    loadCustomerHistory(customerId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleCheck(a: Array<string>, val: any): boolean {
    return a.some(item => val === item);
 }

  return (
    <div style={{padding: '24px'}} >
      <div style={{ display: "flex" }}>
        <md-button 
          onClick={refreshHistory}
          color='green'
          style={{ marginLeft: "auto" }}>Refresh</md-button>
      </div>
      <Timeline >
        { customerHistory 
          .filter(parent => parent.parent === "" )
          .map((parent) => {
            const source = parent.source;
            if (handleCheck(Object.keys(Channels), source)) {
              const iconName = Object.keys(Channels).find( key => key === source);
              if(iconName){
                return (
                  <TimelineEvent
                        key={parent.id} 
                        title={parent.note}
                        collapsible={true}
                        subtitle={eventTimestampToDateTime(parent.timestamp)}
                        iconStyle={{ color: '#1C1C1C'}} 
                        icon={<md-icon name={Channels[iconName].name} size="20" ></md-icon>}
                        titleStyle={ darkMode ? { color: '#F7F7F7'} : { color: '#121212'}}
                        subtitleStyle={ darkMode ? { color: '#F7F7F7'} : { color: '#121212'}}
                        contentStyle={ darkMode ? { backgroundColor: '#121212'} :  { backgroundColor: '#FCFCFC'}} 
                        style={ darkMode ? { color: '#F7F7F7'} : { color: '#121212'}}                
                      >
                    <Timeline>
                      { customerHistory
                        .filter(event => event.parent === parent.id)
                        .map((event) => {
                          const source = event.source;
                          if (handleCheck(Object.keys(Channels), source)){
                            const iconName = Object.keys(Channels).find( key => key === source);
                            if(iconName) { 
                              return (
                                <TimelineEvent
                                      key={event.id}  
                                      title={event.note}
                                      collapsible={false}
                                      subtitle={eventTimestampToDateTime(event.timestamp)}
                                      iconStyle={{color: '#1C1C1C'}} 
                                      icon={<md-icon name={Channels[iconName].name} size="20" ></md-icon>}
                                      titleStyle={ darkMode ? { color: '#F7F7F7'} : { color: '#121212'}}
                                      subtitleStyle={ darkMode ? { color: '#F7F7F7'} : { color: '#121212'}}
                                 />
                              )
                            } else {
                              return <></>;
                            }
                          } else {
                            return <></>;
                          }
                        }
                      )}
                    </Timeline>
                  </TimelineEvent>
                );
              } else {
                return <></>;
              }
            } else {
              return <></>;
            }
          } 
        )}
      </Timeline>
    </div>
  );
};

export default App;

