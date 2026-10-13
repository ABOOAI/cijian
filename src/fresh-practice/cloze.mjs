// Original bounded practice bank: 24 independent cloze passages; six per concept.
export const clozeQuestions = [
  {
    "id": "fresh-cloze-agreement-01",
    "module": "cloze",
    "conceptId": "cloze-agreement",
    "title": "The last customer",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "is",
      "are",
      "am",
      "be"
    ],
    "answer": "am",
    "explanationZh": "空格前的主语是 I（我），一般现在时要用 am。后面的 the last customer 描述“我”是最后一位顾客。",
    "distractorExplanations": {
      "is": "is 用于第三人称单数；本句说话人用 I 指自己，不能用 is。",
      "are": "are 可与 you 或复数主语搭配，这里的主语是 I。",
      "be": "be 是原形；本句没有 can 等词，不能直接用 I be 表达现在的身份。"
    },
    "passage": "The bakery is almost ready to close. I ____ the last customer today. The baker puts two warm rolls in a paper bag for me. Then she turns the shop sign around and begins to clean the counter.",
    "completedPassage": "The bakery is almost ready to close. I am the last customer today. The baker puts two warm rolls in a paper bag for me. Then she turns the shop sign around and begins to clean the counter.",
    "spokenFullText": "The bakery is almost ready to close. I am the last customer today. The baker puts two warm rolls in a paper bag for me. Then she turns the shop sign around and begins to clean the counter.",
    "evidenceQuote": "I am the last customer today.",
    "semanticKey": "bakery-closing-last-customer-first-person-am"
  },
  {
    "id": "fresh-cloze-agreement-02",
    "module": "cloze",
    "conceptId": "cloze-agreement",
    "title": "A door to check",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "are",
      "is",
      "be",
      "am"
    ],
    "answer": "is",
    "explanationZh": "主语的中心词是单数 number，above this door 只是说明号码的位置，所以用 is。",
    "distractorExplanations": {
      "are": "are 用于复数等主语；这里说的是一个号码 The number，而不是多个房间。",
      "be": "没有情态动词或 to，原形 be 不能直接作这个一般现在时句子的谓语。",
      "am": "am 只与主语 I 搭配，不能与 The number 搭配。"
    },
    "passage": "We are looking for Room 16 in a small hotel. The number above this door ____ 19. Dad checks our card again, and we walk farther along the hall. At the next corner, we find the right room.",
    "completedPassage": "We are looking for Room 16 in a small hotel. The number above this door is 19. Dad checks our card again, and we walk farther along the hall. At the next corner, we find the right room.",
    "spokenFullText": "We are looking for Room 16 in a small hotel. The number above this door is 19. Dad checks our card again, and we walk farther along the hall. At the next corner, we find the right room.",
    "evidenceQuote": "The number above this door is 19.",
    "semanticKey": "hotel-door-number-singular-head-is"
  },
  {
    "id": "fresh-cloze-agreement-03",
    "module": "cloze",
    "conceptId": "cloze-agreement",
    "title": "Dry gloves",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "be",
      "am",
      "is",
      "are"
    ],
    "answer": "are",
    "explanationZh": "My gloves 是复数主语；后面的 them 也指这双手套。描述它们现在是湿的，要用 are。",
    "distractorExplanations": {
      "be": "这里要用有主语人称和数变化的 be 动词；原形 be 不能直接放在 My gloves 后。",
      "am": "am 对应 I；虽然手套是“我的”，句子主语仍是复数 gloves。",
      "is": "is 对应第三人称单数；gloves 是复数，不能用 is。"
    },
    "passage": "We finish making a snow rabbit outside. My gloves ____ wet, so I take them off at the door. Mum puts them near the heater, but not on it. I use a dry pair when we go out again.",
    "completedPassage": "We finish making a snow rabbit outside. My gloves are wet, so I take them off at the door. Mum puts them near the heater, but not on it. I use a dry pair when we go out again.",
    "spokenFullText": "We finish making a snow rabbit outside. My gloves are wet, so I take them off at the door. Mum puts them near the heater, but not on it. I use a dry pair when we go out again.",
    "evidenceQuote": "My gloves are wet, so I take them off at the door.",
    "semanticKey": "snow-rabbit-wet-gloves-plural-are"
  },
  {
    "id": "fresh-cloze-agreement-04",
    "module": "cloze",
    "conceptId": "cloze-agreement",
    "title": "One person, one team",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "are",
      "am",
      "be",
      "is"
    ],
    "answer": "are",
    "explanationZh": "引号内老师用 You 对梅说话。you 无论指一个人还是多个人，一般现在时都与 are 搭配。",
    "distractorExplanations": {
      "am": "am 只与 I 搭配；老师说的是 You，不是 I。",
      "be": "陈述现在的身份需要 are，原形 be 不能在此单独作谓语。",
      "is": "即使老师只对一名学生说话，主语 you 也用 are，而不用 is。"
    },
    "passage": "Before our word game, the teacher speaks to one student, Mei. “You ____ the team captain today,” she says. “Please collect an answer from your group before you speak.” Mei listens to everyone and writes their final choice on a card.",
    "completedPassage": "Before our word game, the teacher speaks to one student, Mei. “You are the team captain today,” she says. “Please collect an answer from your group before you speak.” Mei listens to everyone and writes their final choice on a card.",
    "spokenFullText": "Before our word game, the teacher speaks to one student, Mei. “You are the team captain today,” she says. “Please collect an answer from your group before you speak.” Mei listens to everyone and writes their final choice on a card.",
    "evidenceQuote": "You are the team captain today",
    "semanticKey": "word-game-single-addressee-you-are"
  },
  {
    "id": "fresh-cloze-agreement-05",
    "module": "cloze",
    "conceptId": "cloze-agreement",
    "title": "Under a sky indoors",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "are",
      "am",
      "be",
      "is"
    ],
    "answer": "am",
    "explanationZh": "空格所在句的主语是 I，所以用 am。surprised 表示“感到惊讶”，描述说话人看到室内星空时的感受。",
    "distractorExplanations": {
      "are": "are 可与 they 搭配，但本句的主语是 I；不要被后一句的 They 影响。",
      "be": "此处是 I 的一般现在时陈述句，需要 am，不能直接用原形 be。",
      "is": "is 可以与 The guide 等第三人称单数搭配，不能与这里的 I 搭配。"
    },
    "passage": "The lights go out in the round room at the science centre. I ____ surprised when bright stars appear above my head. They are pictures on the ceiling, not real stars. Our guide points to a pattern that looks like a big spoon.",
    "completedPassage": "The lights go out in the round room at the science centre. I am surprised when bright stars appear above my head. They are pictures on the ceiling, not real stars. Our guide points to a pattern that looks like a big spoon.",
    "spokenFullText": "The lights go out in the round room at the science centre. I am surprised when bright stars appear above my head. They are pictures on the ceiling, not real stars. Our guide points to a pattern that looks like a big spoon.",
    "evidenceQuote": "I am surprised when bright stars appear above my head.",
    "semanticKey": "science-centre-ceiling-stars-first-person-am"
  },
  {
    "id": "fresh-cloze-agreement-06",
    "module": "cloze",
    "conceptId": "cloze-agreement",
    "title": "Wait for the soup",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "is",
      "be",
      "are",
      "am"
    ],
    "answer": "is",
    "explanationZh": "The soup 是不可数名词作主语，在这里按单数处理，用 is。蒸汽和等待的动作也说明汤现在很烫。",
    "distractorExplanations": {
      "be": "这是描述汤现在状态的完整句子，要用 is，不能直接用原形 be。",
      "are": "汤在这里用不可数名词 soup 表达，不是复数主语，因此不用 are。",
      "am": "am 只与 I 搭配；空格前的主语是 The soup。"
    },
    "passage": "Dad puts a bowl of soup on the table. The soup ____ too hot to eat now. I can see steam above it, so I leave my spoon beside the bowl and wait. A few minutes later, I try a little.",
    "completedPassage": "Dad puts a bowl of soup on the table. The soup is too hot to eat now. I can see steam above it, so I leave my spoon beside the bowl and wait. A few minutes later, I try a little.",
    "spokenFullText": "Dad puts a bowl of soup on the table. The soup is too hot to eat now. I can see steam above it, so I leave my spoon beside the bowl and wait. A few minutes later, I try a little.",
    "evidenceQuote": "The soup is too hot to eat now.",
    "semanticKey": "steaming-soup-wait-uncountable-is"
  },
  {
    "id": "fresh-cloze-connector-01",
    "module": "cloze",
    "conceptId": "cloze-connector",
    "title": "Hearing Grandma",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "so",
      "because",
      "or",
      "but"
    ],
    "answer": "because",
    "explanationZh": "后半句解释为什么关厨房门：隔壁音乐太响，听不清奶奶。因此用 because 引出原因。",
    "distractorExplanations": {
      "so": "so 后面应接关门带来的结果；音乐太响、听不清是关门之前的原因。",
      "or": "or 表示选择，关门和听不清奶奶并不是让人二选一的选项。",
      "but": "but 表示转折；这里的音乐干扰正好解释关门的原因，没有转折关系。"
    },
    "passage": "We close the kitchen door ____ the loud music in the next room makes it hard to hear Grandma. She is showing us how to make bread. Once the door is shut, we can hear every word and follow her steps.",
    "completedPassage": "We close the kitchen door because the loud music in the next room makes it hard to hear Grandma. She is showing us how to make bread. Once the door is shut, we can hear every word and follow her steps.",
    "spokenFullText": "We close the kitchen door because the loud music in the next room makes it hard to hear Grandma. She is showing us how to make bread. Once the door is shut, we can hear every word and follow her steps.",
    "evidenceQuote": "We close the kitchen door because the loud music in the next room makes it hard to hear Grandma.",
    "semanticKey": "kitchen-door-close-music-blocks-hearing-because"
  },
  {
    "id": "fresh-cloze-connector-02",
    "module": "cloze",
    "conceptId": "cloze-connector",
    "title": "A sinking boat",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "because",
      "but",
      "so",
      "or"
    ],
    "answer": "so",
    "explanationZh": "纸船底部有洞是原因，水进入并开始下沉是结果；用 so 连接前因后果。",
    "distractorExplanations": {
      "because": "because 会把进水下沉说成已有洞的原因；文中顺序是有洞导致进水。",
      "but": "进水是船底有洞的自然结果，不是出乎意料的相反情况，因此不用 but。",
      "or": "两件事都在发生，不是“有洞或进水”的二选一关系。"
    },
    "passage": "Our paper boat has a hole in the bottom, ____ water gets inside and it starts to sink. We take it out of the bath and look closely. Next time, we will use a stronger piece of paper.",
    "completedPassage": "Our paper boat has a hole in the bottom, so water gets inside and it starts to sink. We take it out of the bath and look closely. Next time, we will use a stronger piece of paper.",
    "spokenFullText": "Our paper boat has a hole in the bottom, so water gets inside and it starts to sink. We take it out of the bath and look closely. Next time, we will use a stronger piece of paper.",
    "evidenceQuote": "Our paper boat has a hole in the bottom, so water gets inside and it starts to sink.",
    "semanticKey": "paper-boat-hole-causes-water-entry-so"
  },
  {
    "id": "fresh-cloze-connector-03",
    "module": "cloze",
    "conceptId": "cloze-connector",
    "title": "Looks and taste",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "or",
      "because",
      "but",
      "so"
    ],
    "answer": "but",
    "explanationZh": "看起来甜与实际尝起来酸形成反差，后文也说不能只看外观判断味道，所以用 but。",
    "distractorExplanations": {
      "or": "作者描述同一个橙子的外观和味道，两个事实都成立，不是在二选一。",
      "because": "味道很酸不能解释为什么看起来甜，前后不是原因关系。",
      "so": "看起来甜不会导致尝起来酸，后句不是前句的结果。"
    },
    "passage": "The orange looks fresh and sweet, ____ it tastes very sour. I make a funny face after the first bite. Dad laughs and says we cannot always know the taste of fruit by looking at it.",
    "completedPassage": "The orange looks fresh and sweet, but it tastes very sour. I make a funny face after the first bite. Dad laughs and says we cannot always know the taste of fruit by looking at it.",
    "spokenFullText": "The orange looks fresh and sweet, but it tastes very sour. I make a funny face after the first bite. Dad laughs and says we cannot always know the taste of fruit by looking at it.",
    "evidenceQuote": "The orange looks fresh and sweet, but it tastes very sour.",
    "semanticKey": "orange-appearance-sweet-taste-sour-contrast-but"
  },
  {
    "id": "fresh-cloze-connector-04",
    "module": "cloze",
    "conceptId": "cloze-connector",
    "title": "Choose a balloon",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "but",
      "so",
      "because",
      "or"
    ],
    "answer": "or",
    "explanationZh": "每人只能拿一个气球，卖家在问“红色还是蓝色”，所以用 or 连接两个供选择的选项。",
    "distractorExplanations": {
      "but": "but 表示转折，不能清楚表达卖家让孩子在红色与蓝色气球之间选择。",
      "so": "so 表示结果；蓝色气球不是红色气球造成的结果。",
      "because": "because 用来引出原因，a blue one 只是另一种气球选项，不是原因从句。"
    },
    "passage": "At the street fair, each child may take just one balloon. The seller asks, “Would you like a red balloon ____ a blue one?” I choose blue and tie its string to my bag before I walk away.",
    "completedPassage": "At the street fair, each child may take just one balloon. The seller asks, “Would you like a red balloon or a blue one?” I choose blue and tie its string to my bag before I walk away.",
    "spokenFullText": "At the street fair, each child may take just one balloon. The seller asks, “Would you like a red balloon or a blue one?” I choose blue and tie its string to my bag before I walk away.",
    "evidenceQuote": "Would you like a red balloon or a blue one?",
    "semanticKey": "fair-one-balloon-colour-choice-or"
  },
  {
    "id": "fresh-cloze-connector-05",
    "module": "cloze",
    "conceptId": "cloze-connector",
    "title": "Drops on the table",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "because",
      "or",
      "so",
      "but"
    ],
    "answer": "because",
    "explanationZh": "冰碗外侧有水滴流下来，是垫毛巾的原因；作者想保持木桌干燥，因此用 because。",
    "distractorExplanations": {
      "or": "垫毛巾和水滴流下来不是两种可选做法；后半句说明采取措施的原因。",
      "so": "垫毛巾不是碗外侧产生水滴的原因；用 so 会颠倒这里的因果关系。",
      "but": "水滴流下正好解释为什么垫毛巾，并不与这一做法构成转折。"
    },
    "passage": "I put a small towel under the bowl of ice ____ drops of water are running down its sides. I want to keep our wooden table dry. Soon the towel feels wet, but there is no water on the table.",
    "completedPassage": "I put a small towel under the bowl of ice because drops of water are running down its sides. I want to keep our wooden table dry. Soon the towel feels wet, but there is no water on the table.",
    "spokenFullText": "I put a small towel under the bowl of ice because drops of water are running down its sides. I want to keep our wooden table dry. Soon the towel feels wet, but there is no water on the table.",
    "evidenceQuote": "I put a small towel under the bowl of ice because drops of water are running down its sides.",
    "semanticKey": "ice-bowl-water-drops-towel-protects-table-because"
  },
  {
    "id": "fresh-cloze-connector-06",
    "module": "cloze",
    "conceptId": "cloze-connector",
    "title": "Another way through",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "but",
      "because",
      "or",
      "so"
    ],
    "answer": "so",
    "explanationZh": "走到关闭的大门前无法继续，是原因；返回并换路是应对的结果，所以用 so。",
    "distractorExplanations": {
      "but": "门关着导致我们换路，两者顺承因果关系；这里没有“虽然关门却……”的转折。",
      "because": "不是我们返回换路导致门关着；because 会把这处因果方向颠倒。",
      "or": "我们确实返回并换了路，文中不是让读者在两个方案之间选择。"
    },
    "passage": "The path through the park ends at a closed gate, ____ we turn back and take another path. A worker is fixing the gate today. The other path goes around a flower bed and brings us to the main road.",
    "completedPassage": "The path through the park ends at a closed gate, so we turn back and take another path. A worker is fixing the gate today. The other path goes around a flower bed and brings us to the main road.",
    "spokenFullText": "The path through the park ends at a closed gate, so we turn back and take another path. A worker is fixing the gate today. The other path goes around a flower bed and brings us to the main road.",
    "evidenceQuote": "The path through the park ends at a closed gate, so we turn back and take another path.",
    "semanticKey": "closed-park-gate-forces-route-change-so"
  },
  {
    "id": "fresh-cloze-timeprep-01",
    "module": "cloze",
    "conceptId": "cloze-timeprep",
    "title": "An ice slide",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "on",
      "at",
      "in",
      "of"
    ],
    "answer": "in",
    "explanationZh": "winter 表示季节，泛指“在冬季”用 in winter；这里没有限定到某个具体日期。",
    "distractorExplanations": {
      "on": "on 常用于具体某一天；这里 winter 是整个季节。",
      "at": "at 可用于具体时刻或 at night 等表达，但不能说 at winter。",
      "of": "of 常表示所属或关联，不能在这里单独表达“在冬季”。"
    },
    "passage": "Our town builds a small ice slide ____ winter. Children sit on thick mats and slide down one at a time. When the weather gets warm, the ice melts away. We must wait for another cold season to use it again.",
    "completedPassage": "Our town builds a small ice slide in winter. Children sit on thick mats and slide down one at a time. When the weather gets warm, the ice melts away. We must wait for another cold season to use it again.",
    "spokenFullText": "Our town builds a small ice slide in winter. Children sit on thick mats and slide down one at a time. When the weather gets warm, the ice melts away. We must wait for another cold season to use it again.",
    "evidenceQuote": "Our town builds a small ice slide in winter.",
    "semanticKey": "seasonal-town-ice-slide-winter-in"
  },
  {
    "id": "fresh-cloze-timeprep-02",
    "module": "cloze",
    "conceptId": "cloze-timeprep",
    "title": "Toy exchange day",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "in",
      "on",
      "of",
      "at"
    ],
    "answer": "on",
    "explanationZh": "12 May 是具体日期，日期前用 on。后面的 circle that date 也说明这里指日历上的某一天。",
    "distractorExplanations": {
      "in": "in 可用于月份 May，但这里多了日期 12，是具体某一天，要用 on。",
      "of": "of 不用于直接引出活动举行的具体日期。",
      "at": "at 常用于具体钟点；12 May 表示日期，不是几点钟。"
    },
    "passage": "The community toy exchange will be held ____ 12 May. I circle that date on our calendar. My toy truck still works, but I no longer play with it. I hope another child will enjoy taking it home.",
    "completedPassage": "The community toy exchange will be held on 12 May. I circle that date on our calendar. My toy truck still works, but I no longer play with it. I hope another child will enjoy taking it home.",
    "spokenFullText": "The community toy exchange will be held on 12 May. I circle that date on our calendar. My toy truck still works, but I no longer play with it. I hope another child will enjoy taking it home.",
    "evidenceQuote": "The community toy exchange will be held on 12 May.",
    "semanticKey": "community-toy-exchange-calendar-date-on"
  },
  {
    "id": "fresh-cloze-timeprep-03",
    "module": "cloze",
    "conceptId": "cloze-timeprep",
    "title": "Lights along the street",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "of",
      "in",
      "at",
      "on"
    ],
    "answer": "at",
    "explanationZh": "泛指“在夜间”用固定表达 at night。after dark 和早晨关灯的对比也说明这是夜间的日常情况。",
    "distractorExplanations": {
      "of": "of night 不能在这里作表示“在夜间”的时间状语。",
      "in": "本题是泛指夜间的固定表达 at night；不能直接说 in night。",
      "on": "on 可用于某个特定夜晚，如 on Friday night；这里仅有 night，要用 at。"
    },
    "passage": "The street lights near our home shine ____ night. Dad can see the road clearly when he returns from work after dark. In the morning, the lights go off again. Sunlight is bright enough to light the road then.",
    "completedPassage": "The street lights near our home shine at night. Dad can see the road clearly when he returns from work after dark. In the morning, the lights go off again. Sunlight is bright enough to light the road then.",
    "spokenFullText": "The street lights near our home shine at night. Dad can see the road clearly when he returns from work after dark. In the morning, the lights go off again. Sunlight is bright enough to light the road then.",
    "evidenceQuote": "The street lights near our home shine at night.",
    "semanticKey": "streetlights-after-dark-night-at"
  },
  {
    "id": "fresh-cloze-timeprep-04",
    "module": "cloze",
    "conceptId": "cloze-timeprep",
    "title": "An old bridge",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "at",
      "of",
      "on",
      "in"
    ],
    "answer": "in",
    "explanationZh": "1998 表示年份，年份前用 in。石碑上的年份说明这座桥是在何时建成的。",
    "distractorExplanations": {
      "at": "at 可接具体时刻；1998 在文中是年份，不是钟点。",
      "of": "of 不能在本句中直接引出建桥的年份。",
      "on": "on 常接星期或具体日期；仅给出年份 1998 时用 in。"
    },
    "passage": "A stone beside the river says that our town built its first bridge ____ 1998. My aunt remembers crossing it as a child. Today, people still use it to reach the shops on the other side of the river.",
    "completedPassage": "A stone beside the river says that our town built its first bridge in 1998. My aunt remembers crossing it as a child. Today, people still use it to reach the shops on the other side of the river.",
    "spokenFullText": "A stone beside the river says that our town built its first bridge in 1998. My aunt remembers crossing it as a child. Today, people still use it to reach the shops on the other side of the river.",
    "evidenceQuote": "our town built its first bridge in 1998",
    "semanticKey": "stone-bridge-building-year-in"
  },
  {
    "id": "fresh-cloze-timeprep-05",
    "module": "cloze",
    "conceptId": "cloze-timeprep",
    "title": "Paper for recycling",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "on",
      "in",
      "at",
      "of"
    ],
    "answer": "on",
    "explanationZh": "Friday afternoon 是具体到星期五的下午，要用 on；不能只看到 afternoon 就选 in。",
    "distractorExplanations": {
      "in": "泛指下午可说 in the afternoon，但限定为 Friday afternoon 后要用 on。",
      "at": "at 用于具体钟点等，不用于 Friday afternoon 这种“星期加时段”的表达。",
      "of": "of 不能在此直接表示一家人整理旧纸的时间。"
    },
    "passage": "Each week, our family sorts old paper ____ Friday afternoon. We flatten empty boxes and tie newspapers together. A truck collects them the next day. I check every box first, because sometimes a small toy is still hiding inside.",
    "completedPassage": "Each week, our family sorts old paper on Friday afternoon. We flatten empty boxes and tie newspapers together. A truck collects them the next day. I check every box first, because sometimes a small toy is still hiding inside.",
    "spokenFullText": "Each week, our family sorts old paper on Friday afternoon. We flatten empty boxes and tie newspapers together. A truck collects them the next day. I check every box first, because sometimes a small toy is still hiding inside.",
    "evidenceQuote": "our family sorts old paper on Friday afternoon.",
    "semanticKey": "weekly-paper-recycling-friday-afternoon-on"
  },
  {
    "id": "fresh-cloze-timeprep-06",
    "module": "cloze",
    "conceptId": "cloze-timeprep",
    "title": "The square bell",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "in",
      "at",
      "on",
      "of"
    ],
    "answer": "at",
    "explanationZh": "noon 表示“正午”，属于特定时间点，固定说 at noon。后面的十二声钟响与正午相呼应。",
    "distractorExplanations": {
      "in": "in 可用于月份或较长时段等，但“在正午”的固定表达是 at noon。",
      "on": "on 常用于具体某一天；noon 是一天中的时间点，不是日期。",
      "of": "of 不能在这里表示钟在正午敲响这一时间关系。"
    },
    "passage": "The old bell in the town square rings ____ noon every day. I hear twelve slow rings while we sit on a bench nearby. My little sister counts them on her fingers, but she needs two of mine to finish.",
    "completedPassage": "The old bell in the town square rings at noon every day. I hear twelve slow rings while we sit on a bench nearby. My little sister counts them on her fingers, but she needs two of mine to finish.",
    "spokenFullText": "The old bell in the town square rings at noon every day. I hear twelve slow rings while we sit on a bench nearby. My little sister counts them on her fingers, but she needs two of mine to finish.",
    "evidenceQuote": "The old bell in the town square rings at noon every day.",
    "semanticKey": "town-square-bell-twelve-rings-noon-at"
  },
  {
    "id": "fresh-cloze-noun-01",
    "module": "cloze",
    "conceptId": "cloze-noun",
    "title": "Cutting paper shapes",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "gloves",
      "scissors",
      "shoes",
      "socks"
    ],
    "answer": "scissors",
    "explanationZh": "a pair of 可以接多种成对物品，但“沿铅笔线剪纸”和“圆头”共同指向 scissors（剪刀）。",
    "distractorExplanations": {
      "gloves": "gloves 是手套，可以成双，但不能用它们沿线剪出纸星星。",
      "shoes": "shoes 是鞋，虽然也常与 a pair of 连用，却不是剪纸工具。",
      "socks": "socks 是袜子，没有能沿铅笔线剪开纸张的刀刃。"
    },
    "passage": "We are making paper stars for the window. Mum gives me a pair of ____ with round ends. I use them to cut carefully along the pencil lines. The five points look neat, and I put the unused paper aside.",
    "completedPassage": "We are making paper stars for the window. Mum gives me a pair of scissors with round ends. I use them to cut carefully along the pencil lines. The five points look neat, and I put the unused paper aside.",
    "spokenFullText": "We are making paper stars for the window. Mum gives me a pair of scissors with round ends. I use them to cut carefully along the pencil lines. The five points look neat, and I put the unused paper aside.",
    "evidenceQuote": "I use them to cut carefully along the pencil lines.",
    "semanticKey": "paper-stars-round-ended-cutting-tool-scissors"
  },
  {
    "id": "fresh-cloze-noun-02",
    "module": "cloze",
    "conceptId": "cloze-noun",
    "title": "A face looking back",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "curtain",
      "map",
      "poster",
      "mirror"
    ],
    "answer": "mirror",
    "explanationZh": "看到的人与自己同时动作，还能检查脸上的彩绘和帽子，说明面前是 mirror（镜子）。",
    "distractorExplanations": {
      "curtain": "curtain 是窗帘，不会映出与自己同时动作的脸。",
      "map": "map 是地图，展示地点，不能让人检查自己的脸部彩绘。",
      "poster": "poster 是海报，图像不会随着作者举手而同步动作。"
    },
    "passage": "Before the class play, I stand in front of a ____. When I raise my left hand, the person I see moves at the same time. I check the painted lines on my face and straighten my funny hat.",
    "completedPassage": "Before the class play, I stand in front of a mirror. When I raise my left hand, the person I see moves at the same time. I check the painted lines on my face and straighten my funny hat.",
    "spokenFullText": "Before the class play, I stand in front of a mirror. When I raise my left hand, the person I see moves at the same time. I check the painted lines on my face and straighten my funny hat.",
    "evidenceQuote": "When I raise my left hand, the person I see moves at the same time.",
    "semanticKey": "stage-makeup-synchronous-reflection-mirror"
  },
  {
    "id": "fresh-cloze-noun-03",
    "module": "cloze",
    "conceptId": "cloze-noun",
    "title": "Finding a word",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "calendar",
      "album",
      "menu",
      "dictionary"
    ],
    "answer": "dictionary",
    "explanationZh": "按字母顺序查单词，能找到词义和例句，这些线索指向 dictionary（词典）。",
    "distractorExplanations": {
      "calendar": "calendar 是日历，主要列出日期，不按字母顺序提供词义和例句。",
      "album": "album 是相册或专辑，不是用来查单词释义的工具书。",
      "menu": "menu 是菜单，列食物和饮品，不能根据字母顺序系统查询故事里的生词。"
    },
    "passage": "I meet a new word in an English story. I open my ____ and find the words in alphabetical order. Beside the word, there is a short meaning and an example sentence. Now the story makes sense to me.",
    "completedPassage": "I meet a new word in an English story. I open my dictionary and find the words in alphabetical order. Beside the word, there is a short meaning and an example sentence. Now the story makes sense to me.",
    "spokenFullText": "I meet a new word in an English story. I open my dictionary and find the words in alphabetical order. Beside the word, there is a short meaning and an example sentence. Now the story makes sense to me.",
    "evidenceQuote": "Beside the word, there is a short meaning and an example sentence.",
    "semanticKey": "story-unknown-word-alphabetical-meanings-dictionary"
  },
  {
    "id": "fresh-cloze-noun-04",
    "module": "cloze",
    "conceptId": "cloze-noun",
    "title": "One seat for the film",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "passport",
      "recipe",
      "ticket",
      "letter"
    ],
    "answer": "ticket",
    "explanationZh": "电影院入场时出示，且写有电影名、开场时间和座位号的是 ticket（电影票）。",
    "distractorExplanations": {
      "passport": "passport 是护照，记录身份和旅行信息，不会指定这场电影的座位号。",
      "recipe": "recipe 是食谱，说明食材和制作步骤，不是影院入场凭证。",
      "letter": "letter 是信件；影院工作人员检查的、有场次和座位信息的入场凭证是 ticket。"
    },
    "passage": "At the cinema entrance, a worker asks to see my ____. It shows the name of the film, the starting time and my seat number. The worker checks it and points me towards the right door. I keep it until the film ends.",
    "completedPassage": "At the cinema entrance, a worker asks to see my ticket. It shows the name of the film, the starting time and my seat number. The worker checks it and points me towards the right door. I keep it until the film ends.",
    "spokenFullText": "At the cinema entrance, a worker asks to see my ticket. It shows the name of the film, the starting time and my seat number. The worker checks it and points me towards the right door. I keep it until the film ends.",
    "evidenceQuote": "It shows the name of the film, the starting time and my seat number.",
    "semanticKey": "cinema-entry-film-time-seat-ticket"
  },
  {
    "id": "fresh-cloze-noun-05",
    "module": "cloze",
    "conceptId": "cloze-noun",
    "title": "Ready for the post",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "envelope",
      "album",
      "apron",
      "eraser"
    ],
    "answer": "envelope",
    "explanationZh": "能装折好的信纸，有可封合的纸盖，还能写地址、贴邮票的是 envelope（信封）。",
    "distractorExplanations": {
      "album": "album 是相册，虽然能放纸张，却不是靠纸盖封口后写地址、贴邮票寄信的封套。",
      "apron": "apron 是围裙，用于保护衣服；没有用于封信的纸盖。",
      "eraser": "eraser 是橡皮，不能容纳信纸，也没有可封合的纸盖。"
    },
    "passage": "I finish writing a thank-you note to my aunt. I fold it and put it into an ____. Then I close the paper flap, write her address on the front and add a stamp. It is ready for the post.",
    "completedPassage": "I finish writing a thank-you note to my aunt. I fold it and put it into an envelope. Then I close the paper flap, write her address on the front and add a stamp. It is ready for the post.",
    "spokenFullText": "I finish writing a thank-you note to my aunt. I fold it and put it into an envelope. Then I close the paper flap, write her address on the front and add a stamp. It is ready for the post.",
    "evidenceQuote": "Then I close the paper flap, write her address on the front and add a stamp.",
    "semanticKey": "thank-you-note-paper-flap-address-stamp-envelope"
  },
  {
    "id": "fresh-cloze-noun-06",
    "module": "cloze",
    "conceptId": "cloze-noun",
    "title": "Across the stream",
    "prompt": "选择最合适的词，补全短文。",
    "options": [
      "bridge",
      "fence",
      "bench",
      "ladder"
    ],
    "answer": "bridge",
    "explanationZh": "横跨水面、两侧有扶栏，人们能从上面走过小溪的是 bridge（桥）。",
    "distractorExplanations": {
      "fence": "fence 是栅栏，通常用来围住或分隔区域，不是供人从水面上走过的通道。",
      "bench": "bench 是长椅，用来坐；这里描写的是跨过小溪、有两侧扶栏的通道。",
      "ladder": "ladder 是梯子，用来攀爬；walk across 和两侧扶栏共同指向供人行走过溪的桥。"
    },
    "passage": "A narrow stream runs between the campsite and the road. There is a wooden ____ over the water, with a rail on each side. We walk across it one by one without getting our shoes wet, carrying our bags back to the car.",
    "completedPassage": "A narrow stream runs between the campsite and the road. There is a wooden bridge over the water, with a rail on each side. We walk across it one by one without getting our shoes wet, carrying our bags back to the car.",
    "spokenFullText": "A narrow stream runs between the campsite and the road. There is a wooden bridge over the water, with a rail on each side. We walk across it one by one without getting our shoes wet, carrying our bags back to the car.",
    "evidenceQuote": "There is a wooden bridge over the water, with a rail on each side.",
    "semanticKey": "campsite-stream-dry-crossing-railed-bridge"
  }
];
