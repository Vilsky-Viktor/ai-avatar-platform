const JOB_MANAGER_URL = 'http://localhost:3300';
const USER_ID = 'FYEhNio4qvVGifcp43R4cogOoLw2';
const AVATAR_ID = '0mQQOxYy0EIZeMLwZ9yZ';
const GROUP_ID = '1103aeaa-c149-4d66-9368-74d385f508c4';

const res = await fetch(`${JOB_MANAGER_URL}/train-loras`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': USER_ID,
  },
  body: JSON.stringify({
    avatarId: AVATAR_ID,
    groupId: GROUP_ID,
    avatarType: 'twin',
    parameters: {
      gender: 'male',
      ethnicity: '',
      skinColor: '',
      age: '',
      attractiveness: '',
      body: '',
      face: '',
      hairStyle: '',
      hairColor: '',
      eyes: '',
      skin: '',
      facialHair: '',
      nose: '',
      eyeLashes: '',
      eyeBrows: '',
      outfit: '',
      lips: '',
      bustSize: '',
      ears: '',
      bodyHair: '',
      height: '',
    },
  }),
});

const data = await res.json();
console.log(JSON.stringify(data, null, 2));
