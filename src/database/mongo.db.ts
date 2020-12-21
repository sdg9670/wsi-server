import ConfigManager from '@/config';
import mongoose, { Schema } from 'mongoose';

interface Place extends mongoose.Document {
  _id: String;
  email: String;
  address: {
    jibun: String;
    road: String;
  };
  coord: {
    x: mongoose.Types.Decimal128;
    y: mongoose.Types.Decimal128;
  };
  places: [
    {
      _id?: mongoose.Types.ObjectId;
      name: String;
      detailAddress: String;
      description: String;
      pictures: [
        {
          _id?: mongoose.Types.ObjectId;
          name: String;
          lastModified: Number;
          sizeText: String;
          size: Number;
          type: { type: String };
          ext: String;
        }
      ];
      score: Number;
      createTime: Date;
    }
  ];
}

class MongoDB {
  private static config = ConfigManager.config.db.mongo;
  private static placeSchema = new Schema<Place>({
    _id: { type: String },
    email: String,
    address: {
      jibun: String,
      road: String,
    },
    coord: {
      x: mongoose.Types.Decimal128,
      y: mongoose.Types.Decimal128,
    },
    places: [
      {
        name: String,
        detailAddress: String,
        description: String,
        pictures: [
          {
            name: String,
            lastModified: Number,
            sizeText: String,
            size: Number,
            type: { type: String },
            ext: String,
          },
        ],
        score: Number,
        createTime: Date,
      },
    ],
  });
  public static place: mongoose.Model<Place>;

  // 구동
  async run() {
    this.setModels();
    mongoose.connect(
      `mongodb://${MongoDB.config.uri.host}:${MongoDB.config.uri.port}/${MongoDB.config.uri.database}?authSource=admin`,
      MongoDB.config.options
    );

    mongoose.connection.on('connected', () => {
      console.log('Connected to MongoDB');
    });
  }

  // 모델 설정
  private setModels() {
    const decimal2JSON = (v: any, i?: string, prev?: any) => {
      if (v !== null && typeof v === 'object') {
        if (v.constructor.name === 'Decimal128') prev[i] = parseFloat(v);
        else
          Object.entries(v).forEach(([key, value]) =>
            decimal2JSON(value, key, prev ? prev[i] : v)
          );
      }
    };

    MongoDB.placeSchema.set('toJSON', {
      transform: (doc: any, ret: any) => {
        decimal2JSON(ret);
        return ret;
      },
    });

    MongoDB.place = mongoose.model<Place>('place', MongoDB.placeSchema);
  }
}

export default MongoDB;
