import {
  addDoc,
  collection,
  deleteDoc,
  DocumentData,
  DocumentReference,
  FirestoreDataConverter,
  getDocs,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from 'firebase/firestore';
import { Db } from './firebase';

export interface place {
  name: string;
}

const placeDataConverter: FirestoreDataConverter<place> = {
  toFirestore(place: place): DocumentData {
    return place;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    option: SnapshotOptions
  ): place {
    return { name: snapshot.data(option).name };
  },
};

export async function createPlace(props: {
  place: place;
  groupId: string;
}): Promise<DocumentReference<place>> {
  try {
    return await addDoc(
      collection(Db(), `group/${props.groupId}/place`).withConverter(
        placeDataConverter
      ),
      props.place
    );
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}

export async function listPlace(
  groupId: string
): Promise<QueryDocumentSnapshot<place>[]> {
  try {
    const data: QueryDocumentSnapshot<place>[] = [];
    await getDocs(
      collection(Db(), `group/${groupId}/place`).withConverter(
        placeDataConverter
      )
    ).then((e) => {
      e.forEach((_) => data.push(_));
    });
    return data;
  } catch (error) {
    throw new Error('');
  }
}

export async function deletePlace(
  place: QueryDocumentSnapshot<place>
): Promise<void> {
  try {
    return await deleteDoc(place.ref);
  } catch (error) {
    console.error(error);
    throw new Error('');
  }
}
