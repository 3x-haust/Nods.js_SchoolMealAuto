import axios from 'axios';

export async function getMealData(date1) {
  const date = date1.replace(/-/g, '');
  const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=B10&SD_SCHUL_CODE=7011569&MLSV_YMD=${date}`;

  try {
    const response = await axios.get(url);
    if(response.status != 200)  return ['급식 정보가 없습니다.'];

    const mealData = response.data.mealServiceDietInfo[1].row;
    let dishNames = mealData.map(meal => meal.DDISH_NM);

    dishNames = dishNames.map(dish => {
      return dish.replace(/<[^>]*>/g, '').replace(/\([^)]*\)/g, '').replace(/\*/g, '').replace(/\./g, '');
    });

    return dishNames;
  } catch (error) {
    console.error(`Error fetching meal data: ${error}`);
  }
}

//getMealData('2024-05-21');