
import { Dispatch, createContext, useReducer, ReactNode } from "react";

export interface JsonItem {
  id:number; text:string; title:string; url:string
}

export type DataBox = {
  id: string;
  title: string;
  category: string;
  datail: string;
  date: string;
}

export type DataBoxList = DataBox[];

interface State {
  dataBoxList: DataBoxList;
  dataBox: DataBox;
}

interface Action {
  type: string,
  dataBoxList?: DataBoxList,
  dataBox?: DataBox;
}

interface Props {
  children: ReactNode
}

export const dataContext = createContext({} as {
  state: State,
  dispatch: Dispatch<Action>
})

const reducer = (state:State,action:Action) => {
  const actionList = action.dataBoxList ?? [];
  switch (action.type) {
    case "data/add":
      return {
        ...state,
        dataBoxList: actionList
      }
    case "data/update":
      const __ = actionList.map((item) => {
        return item.id === action.dataBox!.id ? action.dataBox : item; 
      }).filter(Boolean) as DataBox[];
      return {
        ...state,
        dataBoxList: __
      }
    default:
      return state
  }
}

const initalState: State = {
  dataBoxList:[
    {
      id: "1", title: "name01", category: "", datail: "datail", date: "20230102",
    },
    { id: "2", title: "目的とコンテンツのアルゴリズム02", category: "", datail: "datail", date: "20230102",
    }
  ],
  dataBox:  {
    id: "1", title: "name", category: "", datail: "datail", date: "20230102",
  }
}

export const DataProvider = (props:Props) => {
  const [state,dispatch] = useReducer(reducer,initalState);
  return <dataContext.Provider value={{state,dispatch}}>{props.children}</dataContext.Provider>
}