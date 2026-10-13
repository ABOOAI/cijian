// Original independent Grade 7 reading passages. One question per passage.
export const readingQuestions = [
  {
    "id": "fresh-read-detail-01",
    "module": "reading",
    "conceptId": "read-detail",
    "title": "At the sea-life centre",
    "prompt": "参观者可以拿起哪一样东西？",
    "options": [
      "A living crab",
      "An empty shell",
      "A sea plant",
      "A fish egg"
    ],
    "answer": "An empty shell",
    "explanationZh": "原文明确允许参观者从托盘中拿起空贝壳，答案是 An empty shell。活螃蟹、水草和鱼卵都不是获准拿起的物品。",
    "distractorExplanations": {
      "A living crab": "螃蟹在浅水池里，文中没有允许参观者把它们拿起来。",
      "A sea plant": "原文要求把水草留在水里，与拿起水草相反。",
      "A fish egg": "鱼卵隔着玻璃展示，允许拿起的是托盘中的空贝壳。"
    },
    "passage": "A guide welcomes our class to the sea-life centre. There are living crabs in a shallow pool and fish eggs behind glass. The guide lets us pick up an empty shell from a tray. We must leave the sea plants in the water. Before we leave, we wash our hands and thank the guide for answering our questions.",
    "passageId": "fresh-passage-detail-01",
    "evidenceQuote": "The guide lets us pick up an empty shell from a tray.",
    "semanticKey": "sea-life-centre-permitted-empty-shell-handling"
  },
  {
    "id": "fresh-read-detail-02",
    "module": "reading",
    "conceptId": "read-detail",
    "title": "Two thermometers",
    "prompt": "哪个位置的温度计显示 24 度？",
    "options": [
      "Beside the gate",
      "On the sunny wall",
      "In the classroom",
      "Under the tree"
    ],
    "answer": "Under the tree",
    "explanationZh": "要把温度与测量位置对应起来：树下是 24 度，阳光照射的墙上是 30 度。因此选 Under the tree。",
    "distractorExplanations": {
      "Beside the gate": "大门旁的信息是风很大，没有给出该处的温度。",
      "On the sunny wall": "墙上的温度计显示 30 度，不是题目中的 24 度。",
      "In the classroom": "文中只说教室窗户开着，并未在教室内测得 24 度。"
    },
    "passage": "For a weather project, Rosa puts one thermometer on a sunny wall and another under a tree. At noon, the one on the wall shows thirty degrees. The thermometer under the tree shows twenty-four degrees. Her partner writes both results down. They also note that the classroom window is open and a strong wind is blowing beside the gate.",
    "passageId": "fresh-passage-detail-02",
    "evidenceQuote": "The thermometer under the tree shows twenty-four degrees.",
    "semanticKey": "weather-project-shade-temperature-location-match"
  },
  {
    "id": "fresh-read-detail-03",
    "module": "reading",
    "conceptId": "read-detail",
    "title": "The bakery display",
    "prompt": "哪种面包里面有苹果块？",
    "options": [
      "The square buns",
      "The long rolls",
      "The round buns",
      "The thin breadsticks"
    ],
    "answer": "The square buns",
    "explanationZh": "题目问苹果馅对应哪种面包。原文把苹果块与方形小面包直接对应，所以选 The square buns。",
    "distractorExplanations": {
      "The long rolls": "长面包里面是奶酪，不是苹果块。",
      "The round buns": "圆形小面包里面是甜红豆，不是苹果块。",
      "The thin breadsticks": "原文明确说细面包棒里面没有馅。"
    },
    "passage": "The bakery has four kinds of bread today. The long rolls have cheese inside, while the round buns have sweet red beans. Small pieces of apple fill the square buns. The thin breadsticks have nothing inside them. A sign asks customers to use the metal tongs when choosing bread. Jun buys a square bun and a bottle of milk.",
    "passageId": "fresh-passage-detail-03",
    "evidenceQuote": "Small pieces of apple fill the square buns.",
    "semanticKey": "bakery-shape-and-filling-square-apple-match"
  },
  {
    "id": "fresh-read-detail-04",
    "module": "reading",
    "conceptId": "read-detail",
    "title": "Testing a small robot",
    "prompt": "哪个操作会让轮子停止，但灯仍然亮着？",
    "options": [
      "Pressing the green button",
      "Lifting the side handle",
      "Pulling the red lever",
      "Closing the front door"
    ],
    "answer": "Pulling the red lever",
    "explanationZh": "原文明确说明拉红色控制杆会停下轮子，同时灯保持亮着。两个条件都符合，所以选 Pulling the red lever。",
    "distractorExplanations": {
      "Pressing the green button": "绿色按钮负责开灯，文中没有说它会让轮子停止。",
      "Lifting the side handle": "抬起侧面的把手会让铃响，不是停止轮子的操作。",
      "Closing the front door": "原文明说关前门不会改变轮子或灯的状态。"
    },
    "passage": "Toby tests a small robot at a science show. Pressing the green button turns on its lamp. Pulling the red lever stops the wheels, but the lamp stays on. Lifting the side handle makes a short bell ring. The robot also has a little front door for carrying messages. Closing that door does not change the wheels or the lamp.",
    "passageId": "fresh-passage-detail-04",
    "evidenceQuote": "Pulling the red lever stops the wheels, but the lamp stays on.",
    "semanticKey": "science-show-robot-red-lever-wheel-stop-lamp-on"
  },
  {
    "id": "fresh-read-detail-05",
    "module": "reading",
    "conceptId": "read-detail",
    "title": "Helping at the animal shelter",
    "prompt": "谁负责给兔子换饮用水？",
    "options": [
      "Hana",
      "Mr West",
      "Victor",
      "Sam"
    ],
    "answer": "Victor",
    "explanationZh": "换兔子饮用水这项工作明确由 Victor 完成。其他人物各自有不同的任务，不能只看到动物收容所这个共同场景就混淆。",
    "distractorExplanations": {
      "Hana": "Hana 的工作是给狗梳毛，不是给兔子换水。",
      "Mr West": "Mr West 为鸟准备食物，没有负责兔子的饮用水。",
      "Sam": "Sam 清理的是空猫窝，不是兔子的水。"
    },
    "passage": "Four volunteers help at the animal shelter before it opens. Hana brushes a friendly dog, and Sam cleans the empty cat beds. Victor replaces the rabbits’ drinking water with fresh water. Mr West prepares food for the birds. Later, all four check that the gates are closed. They leave a short report for the afternoon team before going home.",
    "passageId": "fresh-passage-detail-05",
    "evidenceQuote": "Victor replaces the rabbits’ drinking water with fresh water.",
    "semanticKey": "animal-shelter-volunteer-rabbit-water-role"
  },
  {
    "id": "fresh-read-detail-06",
    "module": "reading",
    "conceptId": "read-detail",
    "title": "A free kite workshop",
    "prompt": "参加者需要自己带什么材料？",
    "options": [
      "Glue",
      "A sheet of newspaper",
      "Wooden sticks",
      "String"
    ],
    "answer": "A sheet of newspaper",
    "explanationZh": "题目问需要自带的材料。通知只要求每位参加者自带一张报纸，木条、线和胶水由活动提供。",
    "distractorExplanations": {
      "Glue": "胶水在桌上供大家共用，不需要自己带。",
      "Wooden sticks": "参加者在门口会领取木条，不是自带材料。",
      "String": "线和木条一起在门口发放，通知没有要求自带。"
    },
    "passage": "The community hall is running a free kite workshop. Each visitor receives wooden sticks and a length of string at the door. Glue is shared at the tables. The notice asks every visitor to bring a sheet of newspaper for the kite’s body. Finished kites can be tested on the field outside if the wind is strong enough.",
    "passageId": "fresh-passage-detail-06",
    "evidenceQuote": "The notice asks every visitor to bring a sheet of newspaper for the kite’s body.",
    "semanticKey": "kite-workshop-participant-newspaper-versus-provided-supplies"
  },
  {
    "id": "fresh-read-time-01",
    "module": "reading",
    "conceptId": "read-time",
    "title": "Making a short film",
    "prompt": "加入背景音乐之前，学生们刚完成哪一步？",
    "options": [
      "Choosing the film title",
      "Recording the voices",
      "Showing the film to parents",
      "Matching pictures to the voices"
    ],
    "answer": "Matching pictures to the voices",
    "explanationZh": "按制作顺序，先把图片与录音配好，再加入背景音乐。题目问紧挨着加音乐之前的一步，因此选 Matching pictures to the voices。",
    "distractorExplanations": {
      "Choosing the film title": "选片名是第一步，之后还要录音和配图，不能算加音乐前刚完成的一步。",
      "Recording the voices": "录音后还要把图片与声音配好，才加入音乐。",
      "Showing the film to parents": "给家长放映是最后一步，在加入背景音乐之后。"
    },
    "passage": "Our class makes a short film about street markets. First, we choose a title. Next, we record the voices for the story. After that, we match pictures to the voices. We add background music only when the pictures are ready. Finally, we show the finished film to our parents. Nobody changes the order because each step uses work from the step before.",
    "passageId": "fresh-passage-time-01",
    "evidenceQuote": "After that, we match pictures to the voices. We add background music only when the pictures are ready.",
    "semanticKey": "market-film-production-immediately-before-music-sequence"
  },
  {
    "id": "fresh-read-time-02",
    "module": "reading",
    "conceptId": "read-time",
    "title": "Choosing a sewing lesson",
    "prompt": "Mina 可以参加哪一天的缝纫课？",
    "options": [
      "June 18",
      "June 4",
      "June 25",
      "June 11"
    ],
    "answer": "June 18",
    "explanationZh": "Mina 在 6 月 6 日回来，6 月 20 日出发，因此只能选这段时间里的课程。6 月 11 日取消了，剩下符合条件的是 June 18。",
    "distractorExplanations": {
      "June 4": "6 月 4 日她尚未从旅行中回来，不在可参加的时间内。",
      "June 25": "6 月 25 日已经晚于她 6 月 20 日去露营的日期。",
      "June 11": "虽然 6 月 11 日在两次出行之间，但当天的课已经取消。"
    },
    "passage": "The sewing club lists four lessons in June: June 4, June 11, June 18, and June 25. The June 11 lesson is cancelled because the teacher will be away. Mina returns from a trip on June 6 and leaves for camp on June 20. She wants to attend a lesson between her trip and her camp. She checks the list carefully.",
    "passageId": "fresh-passage-time-02",
    "evidenceQuote": "The sewing club lists four lessons in June: June 4, June 11, June 18, and June 25. The June 11 lesson is cancelled because the teacher will be away. Mina returns from a trip on June 6 and leaves for camp on June 20.",
    "semanticKey": "sewing-lesson-date-window-and-cancellation-filter"
  },
  {
    "id": "fresh-read-time-03",
    "module": "reading",
    "conceptId": "read-time",
    "title": "A ride on the museum tram",
    "prompt": "有轨电车几点出发？",
    "options": [
      "At 10:20",
      "At 10:55",
      "At 10:35",
      "At 10:40"
    ],
    "answer": "At 10:35",
    "explanationZh": "取票时间是 10:20，出发时间在取票后 15 分钟，所以是 10:35。行程的 20 分钟属于出发之后，不用加进出发时刻。",
    "distractorExplanations": {
      "At 10:20": "10:20 是取票时间，电车还要过 15 分钟才出发。",
      "At 10:55": "10:55 是按 20 分钟车程算出的结束时间，不是出发时间。",
      "At 10:40": "这里误把 20 分钟车程加到了取票时间上；等待时间其实是 15 分钟。"
    },
    "passage": "Ella collects her tram ticket at the museum desk at 10:20. The tram leaves fifteen minutes after she collects the ticket. Its journey around the museum grounds lasts twenty minutes. Ella uses the waiting time to fill her water bottle. She must be at the stop before the tram leaves because it cannot wait for late passengers.",
    "passageId": "fresh-passage-time-03",
    "evidenceQuote": "Ella collects her tram ticket at the museum desk at 10:20. The tram leaves fifteen minutes after she collects the ticket.",
    "semanticKey": "museum-tram-ticket-time-plus-wait-separate-journey-duration"
  },
  {
    "id": "fresh-read-time-04",
    "module": "reading",
    "conceptId": "read-time",
    "title": "Watering the roof garden",
    "prompt": "星期四之后，Arun 下一次在哪一天早晨浇水？",
    "options": [
      "Friday",
      "Saturday",
      "Sunday",
      "Monday"
    ],
    "answer": "Saturday",
    "explanationZh": "浇水规则是土壤干了才浇。星期五早晨土仍湿，没有浇；星期六早晨土变干，他照常执行规则，因此下一次是 Saturday。",
    "distractorExplanations": {
      "Friday": "星期五早晨土壤仍湿，原文明说他没有加水。",
      "Sunday": "星期六早晨已经满足土干的条件，而且他当天执行了浇水规则，不会等到星期日。",
      "Monday": "原文在星期六已说明他执行规则，没有支持等到星期一。"
    },
    "passage": "Arun checks the roof garden every morning. He waters the plants only when the soil feels dry. He waters them on Thursday morning. Heavy rain falls that night, and the soil is still wet on Friday morning, so he adds no water. By Saturday morning, the soil feels dry again. Arun follows his usual rule before eating breakfast.",
    "passageId": "fresh-passage-time-04",
    "evidenceQuote": "He waters the plants only when the soil feels dry. He waters them on Thursday morning. Heavy rain falls that night, and the soil is still wet on Friday morning, so he adds no water. By Saturday morning, the soil feels dry again. Arun follows his usual rule before eating breakfast.",
    "semanticKey": "roof-garden-watering-next-day-satisfying-dry-soil-rule"
  },
  {
    "id": "fresh-read-time-05",
    "module": "reading",
    "conceptId": "read-time",
    "title": "The survey announcement",
    "prompt": "按更新后的安排，调查结果在哪一天公布？",
    "options": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday"
    ],
    "answer": "Thursday",
    "explanationZh": "Wednesday 是最初计划的日期；由于一班需要更多时间，公布结果改到 Thursday。题目问更新后的安排，要采用改期后的日期。",
    "distractorExplanations": {
      "Monday": "星期一是发问卷的日期，尚未收齐答案。",
      "Tuesday": "星期二是学生交回问卷的日期，不是公布结果的日期。",
      "Wednesday": "星期三只是最初计划；后文明确说明公布结果改到星期四。"
    },
    "passage": "On Monday, the student council gives every class a survey about school lunches. Students return their answers on Tuesday. The council plans to announce the results on Wednesday, but one class needs extra time. The announcement therefore moves to Thursday. On Friday, the kitchen team meets to discuss the results and decide which new dish to try first.",
    "passageId": "fresh-passage-time-05",
    "evidenceQuote": "The council plans to announce the results on Wednesday, but one class needs extra time. The announcement therefore moves to Thursday.",
    "semanticKey": "lunch-survey-announcement-revised-schedule-over-original"
  },
  {
    "id": "fresh-read-time-06",
    "module": "reading",
    "conceptId": "read-time",
    "title": "Waiting for general swimming",
    "prompt": "Lin 最早几点可以参加自由游泳？",
    "options": [
      "At 9:00",
      "At 11:45",
      "At 12:30",
      "At 4:00"
    ],
    "answer": "At 12:30",
    "explanationZh": "自由游泳在游泳课结束后开始，课程结束时间是 12:30。因此即使 Lin 在 11:45 到达，也要等到 12:30。",
    "distractorExplanations": {
      "At 9:00": "9:00 开始的是家庭游泳时段，不是她持票参加的自由游泳。",
      "At 11:45": "11:45 是到达时间，此时仍在上游泳课。",
      "At 4:00": "下午 4:00 是自由游泳结束时间，不是最早能入场的时间。"
    },
    "passage": "The pool has family swimming from 9:00 to 11:00 in the morning. Swimming lessons run from 11:00 to 12:30. General swimming begins when the lessons finish and continues until 4:00 in the afternoon. Lin arrives at 11:45 with a general swimming ticket. A worker asks her to wait in the seating area until her session begins.",
    "passageId": "fresh-passage-time-06",
    "evidenceQuote": "Swimming lessons run from 11:00 to 12:30. General swimming begins when the lessons finish",
    "semanticKey": "pool-session-eligibility-earliest-start-after-lessons"
  },
  {
    "id": "fresh-read-reference-01",
    "module": "reading",
    "conceptId": "read-reference",
    "title": "A tunnel for the toy train",
    "prompt": "“raised it”中的“it”指什么？",
    "options": [
      "The toy train",
      "The cardboard tunnel",
      "The table",
      "The station sign"
    ],
    "answer": "The cardboard tunnel",
    "explanationZh": "垫在隧道两侧下面的积木把隧道抬高，火车才得以通过。因此 raised it 中的 it 指 The cardboard tunnel。",
    "distractorExplanations": {
      "The toy train": "需要抬高的是过低的隧道；抬高火车反而不能解决隧道高度不足。",
      "The table": "积木放在隧道两侧下面，原文没有抬高整个桌子。",
      "The station sign": "车站标志是在抬高隧道之后才加上的，不是 it 的指代对象。"
    },
    "passage": "Oscar builds a small railway on a table. His toy train cannot pass through the cardboard tunnel because the tunnel is too low. Oscar puts blocks beneath the tunnel’s sides. He has raised it enough for the train to pass through easily. Then he adds a station sign and invites his sister to test the railway with him.",
    "passageId": "fresh-passage-reference-01",
    "evidenceQuote": "Oscar puts blocks beneath the tunnel’s sides. He has raised it enough for the train to pass through easily.",
    "semanticKey": "toy-railway-raised-it-refers-low-cardboard-tunnel"
  },
  {
    "id": "fresh-read-reference-02",
    "module": "reading",
    "conceptId": "read-reference",
    "title": "At the finish line",
    "prompt": "“They recorded”中的“They”指谁？",
    "options": [
      "The runners",
      "The coaches",
      "The parents",
      "The two helpers"
    ],
    "answer": "The two helpers",
    "explanationZh": "They 承接前一句拿着铅笔和名单站在终点旁的两名助手。记录成绩、交名单都是这两名助手的工作。",
    "distractorExplanations": {
      "The runners": "运动员是被记录成绩的人；前一句拿着名单的主语是两名助手。",
      "The coaches": "教练在饮水站附近，没有站在终点记录成绩。",
      "The parents": "家长坐在座位上观看，文中没有说他们记录用时。"
    },
    "passage": "The runners gathered at the far end of the sports field. Their coaches waited near the water station, while parents watched from the seats. Two helpers stood beside the finish line with pencils and a list. They recorded each runner’s finishing time. After the race, the helpers gave the list to the teacher who was checking the results.",
    "passageId": "fresh-passage-reference-02",
    "evidenceQuote": "Two helpers stood beside the finish line with pencils and a list. They recorded each runner’s finishing time.",
    "semanticKey": "school-race-they-refers-finish-line-timekeepers"
  },
  {
    "id": "fresh-read-reference-03",
    "module": "reading",
    "conceptId": "read-reference",
    "title": "A bright place to paint",
    "prompt": "“works there”中的“there”指哪里？",
    "options": [
      "The balcony",
      "The kitchen",
      "The bedroom",
      "The garden"
    ],
    "answer": "The balcony",
    "explanationZh": "Nadia 把颜料拿到阳光明亮的阳台，下一句的 there 就指这个作画地点：The balcony。",
    "distractorExplanations": {
      "The kitchen": "厨房的桌子正有人使用，所以她没有选择在厨房画画。",
      "The bedroom": "卧室太暗，是她放弃的地点，不是后来作画的地点。",
      "The garden": "花园是她从阳台上看到父亲种花的地方，不是她作画的位置。"
    },
    "passage": "Nadia wants to paint a bowl of fruit. The kitchen table is busy, and her bedroom is quite dark. She carries her paints to the balcony, where the morning light is bright. She works there until the picture is finished. From her chair, she can also see her father planting flowers in the garden below.",
    "passageId": "fresh-passage-reference-03",
    "evidenceQuote": "She carries her paints to the balcony, where the morning light is bright. She works there until the picture is finished.",
    "semanticKey": "fruit-painting-there-refers-chosen-balcony-workplace"
  },
  {
    "id": "fresh-read-reference-04",
    "module": "reading",
    "conceptId": "read-reference",
    "title": "Choosing a spoon",
    "prompt": "“a smaller one”中的“one”代替什么词？",
    "options": [
      "Pot",
      "Jar",
      "Spoon",
      "Plate"
    ],
    "answer": "Spoon",
    "explanationZh": "Ben 原先拿到的勺子太宽，因此要换一把较小的勺子。one 用来避免重复 spoon，答案是 Spoon。",
    "distractorExplanations": {
      "Pot": "锅仍放在炉子上；他要更换的是伸不进罐口的勺子。",
      "Jar": "Ben 没有要求换小罐子，罐口已经太窄，实际拿到的是茶匙。",
      "Plate": "盘子用来放装满的罐子，后面才出现，不是 one 代替的词。"
    },
    "passage": "Ben helps his aunt put homemade jam into small jars. She gives him a large spoon, but it is too wide for the jar openings. Ben asks for a smaller one. His aunt finds a teaspoon, and the work becomes easier. They leave the large pot on the cooker and put the full jars on a plate to cool.",
    "passageId": "fresh-passage-reference-04",
    "evidenceQuote": "She gives him a large spoon, but it is too wide for the jar openings. Ben asks for a smaller one.",
    "semanticKey": "jam-transfer-smaller-one-substitutes-spoon-not-container"
  },
  {
    "id": "fresh-read-reference-05",
    "module": "reading",
    "conceptId": "read-reference",
    "title": "Less water each morning",
    "prompt": "“This saved water”中的“This”指哪件事？",
    "options": [
      "Filling a glass before breakfast",
      "Turning off the tap while brushing",
      "Buying a new toothbrush",
      "Writing on the bathroom mirror"
    ],
    "answer": "Turning off the tap while brushing",
    "explanationZh": "This 指前一句描述的节水做法，即刷牙时关水龙头，需要漱口时才打开。它指代整件事，而不是某个单独物品。",
    "distractorExplanations": {
      "Filling a glass before breakfast": "文章没有说早餐前装一杯水；节水行为是刷牙时关水龙头。",
      "Buying a new toothbrush": "原文明说他没有买新牙刷，而且更换牙刷不是这里的节水方法。",
      "Writing on the bathroom mirror": "写便条是之后用来提醒自己的行为；This 指它前一句的关水行为。"
    },
    "passage": "For a week, Felix changed one habit in the bathroom. He turned off the tap while brushing his teeth and turned it on again only to rinse his mouth. This saved water every morning. He did not buy a new toothbrush. To remember the habit, he wrote a short note on the bathroom mirror after breakfast.",
    "passageId": "fresh-passage-reference-05",
    "evidenceQuote": "He turned off the tap while brushing his teeth and turned it on again only to rinse his mouth. This saved water every morning.",
    "semanticKey": "bathroom-habit-this-refers-tap-off-action-saving-water"
  },
  {
    "id": "fresh-read-reference-06",
    "module": "reading",
    "conceptId": "read-reference",
    "title": "Two school newspapers",
    "prompt": "七年级学生说的“ours”指什么？",
    "options": [
      "The Grade 6 newspaper",
      "The teacher’s notice",
      "The sports club’s poster",
      "The Grade 7 newspaper"
    ],
    "answer": "The Grade 7 newspaper",
    "explanationZh": "说话者是七年级学生，她把六年级的报纸与“我们的”报纸比较。因此 ours 代替 our newspaper，指七年级的报纸。",
    "distractorExplanations": {
      "The Grade 6 newspaper": "六年级报纸是她在前一句介绍的另一份报纸；ours 表示说话者所属七年级的。",
      "The teacher’s notice": "老师的通知不属于报纸项目，也不是说话者所说的“我们的报纸”。",
      "The sports club’s poster": "体育社团海报虽然挂在旁边，但原文明说它不属于报纸项目。"
    },
    "passage": "Grade 6 and Grade 7 each produce a school newspaper. At an open day, a Grade 7 student explains the difference to visitors. “The Grade 6 newspaper reports sports news. Ours includes interviews with local cooks,” she says. A teacher’s notice and a sports club’s poster hang beside the two newspapers, but neither belongs to the newspaper project.",
    "passageId": "fresh-passage-reference-06",
    "evidenceQuote": "a Grade 7 student explains the difference to visitors. “The Grade 6 newspaper reports sports news. Ours includes interviews with local cooks,” she says.",
    "semanticKey": "school-newspapers-ours-refers-speakers-grade7-publication"
  },
  {
    "id": "fresh-read-purpose-01",
    "module": "reading",
    "conceptId": "read-purpose",
    "title": "Shapes on the window",
    "prompt": "工作人员为什么在玻璃上贴纸做的图形？",
    "options": [
      "To help birds notice the glass",
      "To show visitors where birds sleep",
      "To keep the room warmer",
      "To grow more trees indoors"
    ],
    "answer": "To help birds notice the glass",
    "explanationZh": "纸做的图形使鸟更容易看见玻璃，避免把反射的树当成可以飞过去的空间。这是贴图形的目的。",
    "distractorExplanations": {
      "To show visitors where birds sleep": "文章没有介绍鸟的睡觉位置，图形的作用是让鸟注意到玻璃。",
      "To keep the room warmer": "文中没有提到温度或保暖，问题是鸟可能撞向玻璃。",
      "To grow more trees indoors": "玻璃反射的是附近的树；贴纸图形不会在室内种出树。"
    },
    "passage": "Birds sometimes fly toward the large window at the nature centre. The glass reflects nearby trees, so the birds may think they can fly straight through. Workers put paper shapes across the outside of the window. The shapes make the glass easier for birds to notice. Visitors can still look through the spaces between the shapes and watch the trees.",
    "passageId": "fresh-passage-purpose-01",
    "evidenceQuote": "The shapes make the glass easier for birds to notice.",
    "semanticKey": "nature-centre-window-paper-shapes-bird-glass-visibility"
  },
  {
    "id": "fresh-read-purpose-02",
    "module": "reading",
    "conceptId": "read-purpose",
    "title": "A recipe worth keeping",
    "prompt": "Lena 为什么记下每种材料的准确用量？",
    "options": [
      "To make the soup much saltier",
      "To compare the prices of vegetables",
      "To make the same soup again",
      "To count the guests at dinner"
    ],
    "answer": "To make the same soup again",
    "explanationZh": "她以前常忘记自创菜谱的用量，这次记录下来是为了下次重现相同的味道。因此选 To make the same soup again。",
    "distractorExplanations": {
      "To make the soup much saltier": "她想保持这次的味道，不是增加咸味。",
      "To compare the prices of vegetables": "记录的是材料用量，不是价格，文中也没有比价的计划。",
      "To count the guests at dinner": "记录对象是配料，不是用餐人数；家人喜欢汤才是背景。"
    },
    "passage": "Lena makes vegetable soup for her family. Everyone enjoys it, but she has often forgotten the amounts in recipes she invented. This time, she writes down exactly how much of each ingredient she used. She wants the next pot to taste like this one. Her brother draws a small bowl beside the recipe and asks for another serving.",
    "passageId": "fresh-passage-purpose-02",
    "evidenceQuote": "This time, she writes down exactly how much of each ingredient she used. She wants the next pot to taste like this one.",
    "semanticKey": "homemade-soup-exact-recipe-amounts-repeat-successful-taste"
  },
  {
    "id": "fresh-read-purpose-03",
    "module": "reading",
    "conceptId": "read-purpose",
    "title": "A notice at the park",
    "prompt": "这则通知的主要目的是什么？",
    "options": [
      "To sell tickets for a concert",
      "To explain which park entrance to use",
      "To ask visitors to repair a path",
      "To announce that the whole park is closed"
    ],
    "answer": "To explain which park entrance to use",
    "explanationZh": "通知先说明东门暂时关闭，再指导游客改走西门并按箭头前进，主要目的是告诉游客应该使用哪个入口。",
    "distractorExplanations": {
      "To sell tickets for a concert": "通知没有音乐会或售票信息，内容围绕临时入口路线。",
      "To ask visitors to repair a path": "修路的是工作人员；通知要求游客改走西门，不是参加修路。",
      "To announce that the whole park is closed": "通知明确说明其他区域照常开放，只是东门暂时关闭。"
    },
    "passage": "Park notice: The east gate is closed while workers repair the path beside it. Please enter through the west gate near the bus stop. From there, follow the blue arrows to reach the lake and play area. All other parts of the park are open as usual. The east gate will open again when the repairs are finished.",
    "passageId": "fresh-passage-purpose-03",
    "evidenceQuote": "The east gate is closed while workers repair the path beside it. Please enter through the west gate near the bus stop.",
    "semanticKey": "park-repair-notice-direct-visitors-alternative-entrance"
  },
  {
    "id": "fresh-read-purpose-04",
    "module": "reading",
    "conceptId": "read-purpose",
    "title": "Testing light and plants",
    "prompt": "为什么两个花盆使用相同的土壤和水量？",
    "options": [
      "To make both plants grow in darkness",
      "To avoid measuring the plants",
      "To find the cheapest soil",
      "To test the effect of light fairly"
    ],
    "answer": "To test the effect of light fairly",
    "explanationZh": "实验要比较光照的影响，所以土壤和水量等其他条件保持相同，让光照成为主要差别，使比较公平。",
    "distractorExplanations": {
      "To make both plants grow in darkness": "只有一盆放在暗处，另一盆在明亮窗边，并非两盆都在黑暗中。",
      "To avoid measuring the plants": "相同土壤和水量是为了控制条件，文章没有说因此不用测量生长情况。",
      "To find the cheapest soil": "实验研究的是光照，不是土壤的价格。"
    },
    "passage": "A science group wants to learn how light affects plant growth. They use two plants of the same kind and size. Each pot gets the same soil and amount of water. One pot stands near a bright window, while the other stays in a dark cupboard. Keeping the other conditions the same helps the group test the effect of light fairly.",
    "passageId": "fresh-passage-purpose-04",
    "evidenceQuote": "Keeping the other conditions the same helps the group test the effect of light fairly.",
    "semanticKey": "plant-growth-experiment-constant-water-soil-isolate-light"
  },
  {
    "id": "fresh-read-purpose-05",
    "module": "reading",
    "conceptId": "read-purpose",
    "title": "Practising a short speech",
    "prompt": "Diego 为什么用计时器练习演讲？",
    "options": [
      "To finish within the speaking limit",
      "To choose the loudest microphone",
      "To decide who should speak first",
      "To measure how long people clap"
    ],
    "answer": "To finish within the speaking limit",
    "explanationZh": "每人限时三分钟，而他的初稿近五分钟。他用计时器反复练习和删减，是为了在规定时间内讲完主要内容。",
    "distractorExplanations": {
      "To choose the loudest microphone": "文中没有挑选麦克风，计时器测的是时长，不是音量。",
      "To decide who should speak first": "演讲顺序没有被讨论；他是在调整自己演讲的长度。",
      "To measure how long people clap": "他计时的是练习演讲，并没有测量掌声持续时间。"
    },
    "passage": "Each speaker at the school meeting has three minutes. Diego’s first practice speech lasts nearly five minutes, so he removes one long story. He practises again with a timer and shortens two sentences. He wants to share his main idea before his speaking time ends. His friend listens and checks that the shorter speech still makes sense.",
    "passageId": "fresh-passage-purpose-05",
    "evidenceQuote": "He practises again with a timer and shortens two sentences. He wants to share his main idea before his speaking time ends.",
    "semanticKey": "school-meeting-speech-timer-fit-three-minute-limit"
  },
  {
    "id": "fresh-read-purpose-06",
    "module": "reading",
    "conceptId": "read-purpose",
    "title": "Refilling at the fair",
    "prompt": "组织者为什么设置免费饮水补充点？",
    "options": [
      "To reduce the number of thrown-away bottles",
      "To sell more single-use cups",
      "To keep visitors away from the food stalls",
      "To make visitors leave the fair sooner"
    ],
    "answer": "To reduce the number of thrown-away bottles",
    "explanationZh": "去年空塑料瓶装满垃圾桶，今年让游客带可重复使用的瓶子并免费补水，目的是减少最终丢弃的瓶子数量。",
    "distractorExplanations": {
      "To sell more single-use cups": "补水免费，而且鼓励重复使用瓶子，文中没有销售一次性杯子的目标。",
      "To keep visitors away from the food stalls": "饮水点就在食物摊位旁边，并不是要让游客远离摊位。",
      "To make visitors leave the fair sooner": "补水方便游客在活动期间使用，与让游客提早离开无关。"
    },
    "passage": "At last year’s town fair, the bins quickly filled with empty plastic bottles. This year, the organisers provide free water taps beside the food stalls. Visitors are asked to bring a bottle they can use again and refill it during the day. The organisers hope this will leave fewer bottles to throw away when the fair ends.",
    "passageId": "fresh-passage-purpose-06",
    "evidenceQuote": "The organisers hope this will leave fewer bottles to throw away when the fair ends.",
    "semanticKey": "town-fair-refill-taps-reduce-disposable-bottle-waste"
  }
];
