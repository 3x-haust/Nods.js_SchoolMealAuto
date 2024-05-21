import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export async function getTimeTableData(date) {
  const url = `https://open.neis.go.kr/hub/hisTimetable?Key=${process.env.KEY}&Type=json&ATPT_OFCDC_SC_CODE=B10&SD_SCHUL_CODE=7011569&CLASS_NM=2&https://open.neis.go.kr/hub/hisTimetable?Type=json&ATPT_OFCDC_SC_CODE=B10&SD_SCHUL_CODE=7011569&CLASS_NM=2DDDEP_NM=뉴미디어소프트웨어과&GRADE=1&ALL_TI_YMD=202405${date}`;

  try {
    const response = await axios.get(url);
    if(response.status != 200)  return ['시간표 정보가 없습니다.'];

    const timeTable = response.data.hisTimetable[1].row;
    let timeTableNames = timeTable.map(meal => meal.ITRT_CNTNT);

    return timeTableNames;
  } catch (error) {
    console.error(`Error fetching meal data: ${error}`);
  }
}

//getTimeTableData('21');