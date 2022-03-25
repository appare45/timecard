import {
  addDoc,
  collection,
  DocumentReference,
  FirestoreDataConverter,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  QuerySnapshot,
  startAfter,
} from '@firebase/firestore';
import { deleteDoc, doc } from 'firebase/firestore';
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

export class tag {
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

const TagConverter: FirestoreDataConverter<tag> = {
  toFirestore(data: tag) {
    return {
      name: data.name,
      color: data.color,
    };
  },
  fromFirestore(snapshot, option) {
    const data = snapshot.data(option);
    return new tag(data.name, data.color);
  },
};

export async function createTag(
  tag: tag,
  groupId: string
): Promise<DocumentReference<tag>> {
  if (tag.name.length > 0) {
    try {
      return await addDoc(
        collection(Db(), `group/${groupId}/tag`).withConverter(TagConverter),
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
export async function listTag(
  groupId: string,
  limitNumber?: number,
  lastDoc?: QueryDocumentSnapshot
): Promise<QuerySnapshot<tag>> {
  try {
    const qcs: QueryConstraint[] = [];
    if (limitNumber) qcs.push(limit(limitNumber));
    if (lastDoc) qcs.push(startAfter(lastDoc));
    qcs.push(orderBy('name', 'asc'));
    return getDocs(
      query(collection(Db(), `group/${groupId}/tag`), ...qcs).withConverter(
        TagConverter
      )
    );
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}

interface deletion_interface {
  groupId: string;
  tagId: string;
}

export async function deleteTag(params: deletion_interface): Promise<void> {
  try {
    const targetDoc = doc(Db(), `group/${params.groupId}/tag/`, params.tagId);
    await deleteDoc(targetDoc);
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}
