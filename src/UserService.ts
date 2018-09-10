const usersById: {[key: string]: any} = {
  1: {name: 'Alice'},
  2: {name: 'Bob'},
  3: {name: 'Carl'},
};

export default class UserService {
  public static getUserById(context: any, id: number): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(usersById[id]);
      }, 200);
    });
  }
}
