import {
  addDoc,
  collection,
  DocumentReference,
  FirestoreDataConverter,
  getDocs,
  query,
  QuerySnapshot,
} from '@firebase/firestore';
import { Db } from './firebase';

export type tagColors =
  | 'gray'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'cyan'
  | 'purple'
  | 'pink';

export class Tag {
  private _name = '';
  private _color: tagColors = 'gray';
  public get color(): tagColors {
    return this._color;
  }
  public set color(value: tagColors) {
    this._color = value;
  }
  constructor(name: string, color: tagColors) {
    this.name = name;
    this.color = color;
  }

  public set name(v: string) {
    this._name = v;
  }

  public get name(): string {
    return this._name;
  }
}

const TagConverter: FirestoreDataConverter<Tag> = {
  toFirestore(data: Tag) {
    return {
      name: data.name,
      color: data.color,
    };
  },
  fromFirestore(snapshot, option) {
    const data = snapshot.data(option);
    return new Tag(data.name, data.color);
  },
};

export async function createTag(
  tag: Tag,
  groupId: string
): Promise<DocumentReference<Tag>> {
  if (tag.name.length > 0) {
    try {
      return await addDoc(
        collection(Db, `group/${groupId}/tag`).withConverter(TagConverter),
        tag
      );
    } catch (error) {
      console.error(error);
      throw new Error();
    }
  } else {
    throw new Error('');
  }
}
export async function listTag(groupId: string): Promise<QuerySnapshot<Tag>> {
  try {
    return getDocs(
      query(collection(Db, `group/${groupId}/tag`)).withConverter(TagConverter)
    );
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}
